
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
        console.log('=== PAYMENT VERIFICATION START ===');
        
        // Initialize Supabase client first
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)
        console.log('Supabase client initialized');

        // Get authenticated user from JWT token
        const authHeader = req.headers.get('Authorization')
        console.log('Auth header present:', !!authHeader);
        
        if (!authHeader) {
          console.log('ERROR: No authorization header provided');
          throw new Error('No authorization header provided')
        }

        const token = authHeader.replace('Bearer ', '')
        console.log('Token extracted, length:', token.length);
        
        // Extract user email from Clerk JWT token
        let userEmail: string;
        try {
          const parts = token.split('.');
          console.log('Token parts count:', parts.length);
          
          if (parts.length !== 3) {
            console.log('ERROR: Invalid JWT format, parts:', parts.length);
            throw new Error('Invalid JWT format');
          }
          
          const payload = JSON.parse(atob(parts[1]));
          console.log('JWT payload decoded, keys:', Object.keys(payload));
          
          // Get email from the token - Clerk tokens contain email
          userEmail = payload.email || payload.email_address;
          console.log('User email from token:', userEmail);
          
          if (!userEmail) {
            console.log('ERROR: No email in token payload');
            throw new Error('No email in token');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          throw new Error('Invalid authentication token');
        }

        // Find the user in profiles table by email
        console.log('Looking up user by email in profiles table...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', userEmail)
          .single();

        if (profileError || !profile) {
          console.error('Profile lookup failed:', profileError);
          throw new Error('User profile not found');
        }

        const supabaseUserId = profile.id;
        console.log('Found user profile:', {
          email: profile.email,
          userId: supabaseUserId
        });

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type } = payload
        console.log('Payment payload received:', {
          razorpay_order_id,
          razorpay_payment_id, 
          plan_type,
          amount: payload.amount
        });
        
        // Verify payment signature using Web Crypto API
        console.log('Starting signature verification...');
        
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
          console.log('ERROR: Signature mismatch', {
            expected: expectedSignature,
            received: razorpay_signature
          });
          throw new Error('Invalid payment signature')
        }
        console.log('Payment signature verified successfully');

        // Store payment record using Supabase user ID
        console.log('Inserting payment record...');
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
          console.error('Payment record insertion failed:', paymentError)
          throw new Error('Failed to store payment record')
        }
        console.log('Payment record inserted successfully');

        // Update user subscription using Supabase user ID
        console.log('Creating/updating subscription...');
        const subscriptionEnd = new Date()
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1) // 1 month subscription
        
        console.log('Subscription dates:', {
          start: new Date().toISOString(),
          end: subscriptionEnd.toISOString()
        });

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
          console.error('Subscription creation failed:', subscriptionError)
          throw new Error('Failed to update subscription')
        }
        console.log('Subscription created/updated successfully');
        console.log('=== PAYMENT VERIFICATION SUCCESS ===');

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
