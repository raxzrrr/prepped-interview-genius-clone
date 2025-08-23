-- Fix RLS policies for interview-resources storage bucket
-- First, let's drop any existing conflicting policies
DROP POLICY IF EXISTS "Admin users can upload interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can view interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update interview resources" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view interview resources" ON storage.objects;

-- Create policies for admin to manage interview-resources
CREATE POLICY "Admin can upload interview resources" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can view all interview resources" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can delete interview resources" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admin can update interview resources" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow pro users to view interview resources
CREATE POLICY "Pro users can view interview resources" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM user_subscriptions 
    WHERE user_id = auth.uid() 
      AND plan_type = 'pro' 
      AND status = 'active' 
      AND current_period_end > now()
  )
);