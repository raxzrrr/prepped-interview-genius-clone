-- Fix critical security vulnerability in admin_credentials table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Admin credentials access" ON public.admin_credentials;

-- Create a security definer function to check if current user is admin
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current authenticated user has admin role
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create secure RLS policies for admin_credentials table
-- Only allow admin users to access admin credentials
CREATE POLICY "Only admins can access credentials"
ON public.admin_credentials
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- Also allow access for service role (for edge functions)
CREATE POLICY "Service role can access credentials"
ON public.admin_credentials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);