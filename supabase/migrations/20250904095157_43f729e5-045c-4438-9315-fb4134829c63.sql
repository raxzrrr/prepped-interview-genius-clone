-- Create table for API keys and settings
CREATE TABLE IF NOT EXISTS public.api_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_key_id text,
  razorpay_key_secret text,
  pro_plan_price_inr integer DEFAULT 999,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access API settings
CREATE POLICY "Only admins can access API settings" 
ON public.api_settings 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create the missing get_api_keys function
CREATE OR REPLACE FUNCTION public.get_api_keys()
RETURNS TABLE (
  razorpay_key_id text,
  razorpay_key_secret text,
  pro_plan_price_inr integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.razorpay_key_id,
    s.razorpay_key_secret,
    s.pro_plan_price_inr
  FROM public.api_settings s
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Insert default settings if none exist
INSERT INTO public.api_settings (razorpay_key_id, razorpay_key_secret, pro_plan_price_inr)
SELECT NULL, NULL, 999
WHERE NOT EXISTS (SELECT 1 FROM public.api_settings);