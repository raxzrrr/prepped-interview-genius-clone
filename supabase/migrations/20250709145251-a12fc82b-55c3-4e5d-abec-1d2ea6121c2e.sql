
-- Update storage bucket policies to allow temporary admin access
-- Drop existing policies for course-videos bucket
DROP POLICY IF EXISTS "Admins can upload course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course videos" ON storage.objects;

-- Create updated policies that allow temporary admin access
CREATE POLICY "Admins can upload course videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-videos' AND (
    -- Allow if user has admin role in profiles table
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Allow for testing purposes when no auth.uid() (temporary admin)
    auth.uid() IS NULL
    OR
    -- Allow temporary admin access via JWT claims
    current_setting('request.jwt.claims', true)::json->>'email' = 'admin@interview.ai'
  )
);

CREATE POLICY "Admins can update course videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'course-videos' AND (
    -- Allow if user has admin role in profiles table
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Allow for testing purposes when no auth.uid() (temporary admin)
    auth.uid() IS NULL
    OR
    -- Allow temporary admin access via JWT claims
    current_setting('request.jwt.claims', true)::json->>'email' = 'admin@interview.ai'
  )
);

CREATE POLICY "Admins can delete course videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'course-videos' AND (
    -- Allow if user has admin role in profiles table
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Allow for testing purposes when no auth.uid() (temporary admin)
    auth.uid() IS NULL
    OR
    -- Allow temporary admin access via JWT claims
    current_setting('request.jwt.claims', true)::json->>'email' = 'admin@interview.ai'
  )
);
