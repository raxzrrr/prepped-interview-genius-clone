-- Add API key columns to admin_credentials table
ALTER TABLE public.admin_credentials 
ADD COLUMN gemini_api_key TEXT,
ADD COLUMN google_tts_api_key TEXT,
ADD COLUMN clerk_publishable_key TEXT;

-- Create function to update API keys in admin_credentials
CREATE OR REPLACE FUNCTION public.update_api_keys(
  p_gemini_key TEXT DEFAULT NULL,
  p_tts_key TEXT DEFAULT NULL,
  p_clerk_key TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the API keys in admin_credentials table
  UPDATE public.admin_credentials 
  SET 
    gemini_api_key = COALESCE(p_gemini_key, gemini_api_key),
    google_tts_api_key = COALESCE(p_tts_key, google_tts_api_key),
    clerk_publishable_key = COALESCE(p_clerk_key, clerk_publishable_key),
    updated_at = now()
  WHERE id = (SELECT id FROM public.admin_credentials LIMIT 1);
  
  RETURN TRUE;
END;
$$;

-- Create function to get API keys from admin_credentials
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
  -- Return API keys from admin_credentials
  RETURN QUERY
  SELECT 
    ac.gemini_api_key,
    ac.google_tts_api_key,
    ac.clerk_publishable_key
  FROM public.admin_credentials ac
  LIMIT 1;
END;
$$;