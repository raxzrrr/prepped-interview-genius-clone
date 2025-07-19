-- Update the RLS policy for course_questions to allow temporary admin access
-- First drop the existing policy
DROP POLICY IF EXISTS "Admins can manage course questions" ON public.course_questions;

-- Create a new policy that includes temporary admin access
CREATE POLICY "Admins can manage course questions" ON public.course_questions
FOR ALL
USING (
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )) 
  OR 
  (auth.uid() IS NULL) 
  OR 
  (((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text) = 'admin@interview.ai'::text)
)
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
  )) 
  OR 
  (auth.uid() IS NULL) 
  OR 
  (((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text) = 'admin@interview.ai'::text)
);