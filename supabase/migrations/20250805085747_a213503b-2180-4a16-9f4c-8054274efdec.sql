-- Update the update_api_keys function to include company_name
CREATE OR REPLACE FUNCTION public.update_api_keys(
  p_gemini_key text DEFAULT NULL::text, 
  p_tts_key text DEFAULT NULL::text, 
  p_clerk_key text DEFAULT NULL::text, 
  p_razorpay_key_id text DEFAULT NULL::text, 
  p_razorpay_key_secret text DEFAULT NULL::text, 
  p_pro_plan_price_inr integer DEFAULT NULL::integer,
  p_company_name text DEFAULT NULL::text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the API keys in admin_credentials table including company name
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