-- Add API key columns to profiles table for admin management
ALTER TABLE public.profiles 
ADD COLUMN gemini_api_key TEXT,
ADD COLUMN google_tts_api_key TEXT,
ADD COLUMN clerk_publishable_key TEXT;

-- Create function to update API keys (admin only)
CREATE OR REPLACE FUNCTION public.update_api_keys(
  p_gemini_key TEXT DEFAULT NULL,
  p_tts_key TEXT DEFAULT NULL,
  p_clerk_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id 
  FROM public.profiles 
  WHERE role = 'admin'::user_role 
  LIMIT 1;
  
  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found';
  END IF;
  
  -- Update the API keys
  UPDATE public.profiles 
  SET 
    gemini_api_key = COALESCE(p_gemini_key, gemini_api_key),
    google_tts_api_key = COALESCE(p_tts_key, google_tts_api_key),
    clerk_publishable_key = COALESCE(p_clerk_key, clerk_publishable_key),
    updated_at = now()
  WHERE id = admin_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to get API keys (admin only)
CREATE OR REPLACE FUNCTION public.get_api_keys()
RETURNS TABLE(
  gemini_api_key TEXT,
  google_tts_api_key TEXT,
  clerk_publishable_key TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return API keys
  RETURN QUERY
  SELECT 
    p.gemini_api_key,
    p.google_tts_api_key,
    p.clerk_publishable_key
  FROM public.profiles p
  WHERE p.role = 'admin'::user_role
  LIMIT 1;
END;
$$;