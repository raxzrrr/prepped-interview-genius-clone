
-- Update the RLS policy to be more permissive for testing
-- This will allow temporary admin access without requiring JWT claims

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can manage course videos" ON course_videos;

-- Create a more permissive policy that allows admin operations
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
    -- Allow for testing purposes when no auth.uid() (temporary admin)
    auth.uid() IS NULL
    OR
    -- Allow temporary admin access via JWT claims
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
    -- Allow for testing purposes when no auth.uid() (temporary admin)
    auth.uid() IS NULL
    OR
    -- Allow temporary admin access via JWT claims
    current_setting('request.jwt.claims', true)::json->>'email' = 'admin@interview.ai'
  );
