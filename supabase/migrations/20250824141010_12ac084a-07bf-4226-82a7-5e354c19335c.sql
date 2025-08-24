-- Clean up all existing duplicate policies for interview-resources bucket
DROP POLICY IF EXISTS "Admin can delete interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admin can view all interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Pro users can view interview resources" ON storage.objects;

-- Create clean, non-duplicate policies

-- Admin policy for all operations
CREATE POLICY "Admins can manage interview resources" ON storage.objects
FOR ALL USING (
  bucket_id = 'interview-resources' 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Pro users can download/view resources (handles both purchased and admin-granted)
CREATE POLICY "Pro users can download interview resources" ON storage.objects
FOR SELECT USING (
  bucket_id = 'interview-resources'
  AND EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_subscriptions.user_id = auth.uid()
    AND user_subscriptions.plan_type = 'pro'
    AND user_subscriptions.status = 'active'
    AND (
      -- Either the subscription was granted by admin (no expiry check needed)
      user_subscriptions.was_granted = true
      -- Or it's a purchased subscription that hasn't expired
      OR user_subscriptions.current_period_end > now()
    )
  )
);