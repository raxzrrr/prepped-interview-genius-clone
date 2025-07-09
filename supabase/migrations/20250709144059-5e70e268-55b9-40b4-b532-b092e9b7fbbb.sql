
-- Temporarily update the RLS policies for course_videos to allow temporary admin access
-- This will allow the temporary admin user to add videos

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage course videos" ON course_videos;
DROP POLICY IF EXISTS "Anyone can view active course videos" ON course_videos;

-- Create new policies that work with both regular admin users and temporary admin access
CREATE POLICY "Admins can manage course videos" 
  ON course_videos 
  FOR ALL 
  USING (
    -- Allow if user has admin role in profiles table
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Allow temporary admin access (for testing/demo purposes)
    current_setting('request.jwt.claims', true)::json->>'email' = 'admin@interview.ai'
  )
  WITH CHECK (
    -- Same conditions for insert/update
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    current_setting('request.jwt.claims', true)::json->>'email' = 'admin@interview.ai'
  );

-- Allow anyone to view active course videos
CREATE POLICY "Anyone can view active course videos" 
  ON course_videos 
  FOR SELECT 
  USING (is_active = true);
