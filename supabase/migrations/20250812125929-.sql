-- Drop the overloaded update_api_keys function without company name to resolve PostgREST ambiguity
DROP FUNCTION IF EXISTS public.update_api_keys(p_gemini_key text, p_tts_key text, p_clerk_key text, p_razorpay_key_id text, p_razorpay_key_secret text, p_pro_plan_price_inr integer);

-- Ensure the desired function with company name exists (create if missing)
CREATE OR REPLACE FUNCTION public.update_api_keys(
  p_gemini_key text DEFAULT NULL,
  p_tts_key text DEFAULT NULL,
  p_clerk_key text DEFAULT NULL,
  p_razorpay_key_id text DEFAULT NULL,
  p_razorpay_key_secret text DEFAULT NULL,
  p_pro_plan_price_inr integer DEFAULT NULL,
  p_company_name text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.admin_credentials 
  SET 
    gemini_api_key = COALESCE(p_gemini_key, gemini_api_key),
    google_tts_api_key = COALESCE(p_tts_key, google_tts_api_key),
    clerk_publishable_key = COALESCE(p_clerk_key, clerk_publishable_key),
    razorpay_key_id = COALESCE(p_razorpay_key_id, razorpay_key_id),
    razorpay_key_secret = COALESCE(p_razorpay_key_secret, razorpay_key_secret),
    pro_plan_price_inr = COALESCE(p_pro_plan_price_inr, pro_plan_price_inr),
    company_name = COALESCE(p_company_name, company_name),
    updated_at = now()
  WHERE id = (SELECT id FROM public.admin_credentials LIMIT 1);

  RETURN TRUE;
END;
$$;