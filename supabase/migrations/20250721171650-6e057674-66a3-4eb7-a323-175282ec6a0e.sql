-- Remove API key columns from profiles table since we've centralized API key management
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS gemini_api_key,
DROP COLUMN IF EXISTS google_tts_api_key;