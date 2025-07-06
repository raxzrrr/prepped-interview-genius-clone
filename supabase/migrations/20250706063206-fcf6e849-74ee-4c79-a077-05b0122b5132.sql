
-- Add Pro subscription for the existing user for testing
INSERT INTO public.user_subscriptions (
  user_id,
  plan_type,
  status,
  current_period_start,
  current_period_end
)
VALUES (
  '525c4828-525c-425c-a525-525c48280000',
  'pro',
  'active',
  NOW(),
  (NOW() + INTERVAL '30 days')
);

-- Add corresponding payment record for data consistency
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
VALUES (
  '525c4828-525c-425c-a525-525c48280000',
  'test_order_525c4828',
  'test_payment_525c4828',
  'test_signature_525c4828',
  1999,
  'INR',
  'pro',
  'completed'
);
