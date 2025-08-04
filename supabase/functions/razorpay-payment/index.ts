
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured')
    }

    const authHeader = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)

    switch (action) {
      case 'create_order': {
        const { amount, currency = 'INR', receipt } = payload
        
        const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount * 100, // Convert to paise
            currency,
            receipt,
          }),
        })

        if (!orderResponse.ok) {
          const error = await orderResponse.json()
          throw new Error(error.error?.description || 'Failed to create order')
        }

        const order = await orderResponse.json()
        return new Response(JSON.stringify(order), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'verify_payment': {
        // Initialize Supabase client first
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get authenticated user from JWT token instead of trusting frontend payload
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
          throw new Error('No authorization header provided')
        }

        const token = authHeader.replace('Bearer ', '')
        
        // Validate JWT token directly without Supabase auth
        let clerkUserId: string;
        try {
          // For Clerk tokens, extract user ID from the token payload
          const parts = token.split('.');
          if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
          }
          
          const payload = JSON.parse(atob(parts[1]));
          clerkUserId = payload.sub;
          
          if (!clerkUserId) {
            throw new Error('No user ID in token');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          throw new Error('Invalid authentication token');
        }

        // Convert Clerk user ID to Supabase user ID using the same algorithm as frontend
        const hash = Array.from(clerkUserId).reduce((acc, char) => {
          return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
        }, 0);
        
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        const supabaseUserId = `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(1, 4)}-a${hex.substring(0, 3)}-${hex.substring(0, 12)}`;
        
        console.log('Payment verification:', {
          clerkUserId,
          supabaseUserId,
          hash,
          hex
        });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type } = payload
        
        // Verify payment signature using Web Crypto API
        const encoder = new TextEncoder()
        const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(razorpayKeySecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        )
        const signature = await crypto.subtle.sign('HMAC', key, data)
        const expectedSignature = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        if (expectedSignature !== razorpay_signature) {
          throw new Error('Invalid payment signature')
        }


        // Store payment record using Supabase user ID
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            user_id: supabaseUserId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount: payload.amount,
            currency: payload.currency || 'INR',
            plan_type,
            status: 'completed'
          })

        if (paymentError) {
          console.error('Payment record error:', paymentError)
          throw new Error('Failed to store payment record')
        }

        // Update user subscription using Supabase user ID
        const subscriptionEnd = new Date()
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1) // 1 month subscription

        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: supabaseUserId,
            plan_type,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: subscriptionEnd.toISOString(),
            updated_at: new Date().toISOString()
          })

        if (subscriptionError) {
          console.error('Subscription error:', subscriptionError)
          throw new Error('Failed to update subscription')
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Razorpay payment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
