-- Fix RLS policies for interview_resources table to allow admin inserts
-- Drop existing policy and recreate with proper checks
DROP POLICY IF EXISTS "Admins can manage interview resources" ON public.interview_resources;

-- Create a more comprehensive admin policy that properly handles all operations
CREATE POLICY "Admins can manage interview resources" 
ON public.interview_resources 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);