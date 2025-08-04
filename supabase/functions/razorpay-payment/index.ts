
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fixed namespace UUID for consistent generation (matches frontend)
const NAMESPACE_UUID = '1b671a64-40d5-491e-99b0-da01ff1f3341';

function generateConsistentUUID(userId: string): string {
  try {
    // Simple hash function to create deterministic UUID (matches frontend logic)
    let hash = 0;
    const input = userId + NAMESPACE_UUID;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert hash to hex and pad to create UUID format
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(1, 4)}-a${hex.slice(0, 3)}-${hex.slice(0, 12).padEnd(12, '0')}`;
  } catch (error) {
    console.error("Error generating consistent UUID:", error);
    // Fallback to a random UUID
    return crypto.randomUUID();
  }
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
        
        // Extract Clerk user ID from JWT token
        let clerkUserId: string;
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
          
          // Extract Clerk user ID (sub claim)
          clerkUserId = payload.sub;
          if (!clerkUserId) {
            console.log('ERROR: No Clerk user ID in token payload');
            throw new Error('No Clerk user ID in token');
          }
          
          // Get email from the token - Clerk tokens contain email
          userEmail = payload.email || payload.email_address;
          console.log('User details from token:', {
            clerkUserId,
            email: userEmail
          });
          
          if (!userEmail) {
            console.log('ERROR: No email in token payload');
            throw new Error('No email in token');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          throw new Error('Invalid authentication token');
        }

        // Generate consistent UUID for Supabase (matches frontend logic)
        const supabaseUserId = generateConsistentUUID(clerkUserId);
        console.log('Generated Supabase user ID:', {
          clerkUserId,
          supabaseUserId,
          email: userEmail
        });

        // Verify user exists in profiles table and determine actual user ID
        console.log('Verifying user exists in profiles table...');
        let actualUserId: string;
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', supabaseUserId)
          .single();

        if (profileError || !profile) {
          console.error('Profile lookup by generated ID failed:', profileError);
          console.log('Attempting fallback lookup by email...');
          
          // Fallback: try to find by email in case user was created differently
          const { data: emailProfile, error: emailError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', userEmail)
            .single();
            
          if (emailError || !emailProfile) {
            console.error('Email-based profile lookup also failed:', emailError);
            throw new Error('User profile not found');
          }
          
          console.log('Found user via email fallback:', emailProfile);
          actualUserId = emailProfile.id;
          console.log('Using actual user ID from database:', actualUserId);
        } else {
          console.log('Found user profile by generated ID:', {
            email: profile.email,
            userId: supabaseUserId
          });
          actualUserId = supabaseUserId;
        }

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

        // Store payment record using actual user ID
        console.log('Inserting payment record with user_id:', actualUserId);
        console.log('Payment data to insert:', {
          user_id: actualUserId,
          razorpay_order_id,
          razorpay_payment_id,
          amount: payload.amount,
          currency: payload.currency || 'INR',
          plan_type,
          status: 'completed'
        });
        
        try {
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              user_id: actualUserId,
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              amount: payload.amount,
              currency: payload.currency || 'INR',
              plan_type,
              status: 'completed'
            });

          if (paymentError) {
            console.error('Payment record insertion failed:', paymentError);
            console.error('Error details:', JSON.stringify(paymentError));
            throw new Error(`Failed to store payment record: ${paymentError.message}`);
          }
          console.log('Payment record inserted successfully');
        } catch (error) {
          console.error('Exception during payment insertion:', error);
          throw error;
        }

        // Update user subscription using actual user ID
        console.log('Creating/updating subscription for user_id:', actualUserId);
        const subscriptionEnd = new Date()
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1) // 1 month subscription
        
        console.log('Subscription dates:', {
          start: new Date().toISOString(),
          end: subscriptionEnd.toISOString()
        });

        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: actualUserId,
            plan_type,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: subscriptionEnd.toISOString(),
            updated_at: new Date().toISOString()
          })

        if (subscriptionError) {
          console.error('Subscription creation failed:', subscriptionError)
          console.error('Subscription error details:', JSON.stringify(subscriptionError));
          throw new Error(`Failed to update subscription: ${subscriptionError.message}`)
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
