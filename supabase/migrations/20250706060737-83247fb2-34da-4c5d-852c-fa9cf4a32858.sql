
-- Insert Pro subscriptions for all existing profiles in the database
-- This will give all current users Pro access for testing
INSERT INTO public.user_subscriptions (
  user_id,
  plan_type,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  id as user_id,
  'pro' as plan_type,
  'active' as status,
  NOW() as current_period_start,
  (NOW() + INTERVAL '30 days') as current_period_end
FROM public.profiles
WHERE id NOT IN (
  SELECT user_id 
  FROM public.user_subscriptions 
  WHERE status = 'active' AND current_period_end > NOW()
);

-- Also insert corresponding payment records for these test subscriptions
INSERT INTO public.payments (
  user_id,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  amount,
  currency,
  plan_type,
  status
)
SELECT 
  id as user_id,
  'test_order_' || id as razorpay_order_id,
  'test_payment_' || id as razorpay_payment_id,
  'test_signature_' || id as razorpay_signature,
  1999 as amount,
  'INR' as currency,
  'pro' as plan_type,
  'completed' as status
FROM public.profiles
WHERE id NOT IN (
  SELECT user_id 
  FROM public.user_subscriptions 
  WHERE status = 'active' AND current_period_end > NOW()
);
