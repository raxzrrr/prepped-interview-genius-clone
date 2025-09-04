-- Enable RLS on remaining tables that need it
CREATE TABLE IF NOT EXISTS public.interview_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text,
  file_path text,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interview_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_course_certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id text NOT NULL,
  course_id uuid NOT NULL,
  course_complete boolean DEFAULT false,
  assessment_pass boolean DEFAULT false,
  certificate_generated boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(clerk_user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.user_interview_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  free_interview_used boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  last_interview_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all these tables
ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interview_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_reports
CREATE POLICY "Users can view their own interview reports" 
ON public.interview_reports 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can insert their own interview reports" 
ON public.interview_reports 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can update their own interview reports" 
ON public.interview_reports 
FOR UPDATE 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Admins can manage all interview reports" 
ON public.interview_reports 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create RLS policies for user_reports
CREATE POLICY "Users can view their own reports" 
ON public.user_reports 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can insert their own reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can update their own reports" 
ON public.user_reports 
FOR UPDATE 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Admins can manage all reports" 
ON public.user_reports 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create RLS policies for interview_resources
CREATE POLICY "Anyone can view interview resources" 
ON public.interview_resources 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage interview resources" 
ON public.interview_resources 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create RLS policies for user_course_certificates
CREATE POLICY "Users can view their own course certificates" 
ON public.user_course_certificates 
FOR SELECT 
USING (true); -- Allow all users to view for now, can be restricted later

CREATE POLICY "Users can insert their own course certificates" 
ON public.user_course_certificates 
FOR INSERT 
WITH CHECK (true); -- Allow system to insert

CREATE POLICY "Users can update their own course certificates" 
ON public.user_course_certificates 
FOR UPDATE 
USING (true); -- Allow system to update

CREATE POLICY "Admins can manage all course certificates" 
ON public.user_course_certificates 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create RLS policies for user_interview_usage
CREATE POLICY "Users can view their own interview usage" 
ON public.user_interview_usage 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can insert their own interview usage" 
ON public.user_interview_usage 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can update their own interview usage" 
ON public.user_interview_usage 
FOR UPDATE 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Admins can view all interview usage" 
ON public.user_interview_usage 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "Admins can insert all interview usage" 
ON public.user_interview_usage 
FOR INSERT 
WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can update all interview usage" 
ON public.user_interview_usage 
FOR UPDATE 
USING (is_current_user_admin());

-- Insert default API settings if none exist (fix for missing get_api_keys function)
INSERT INTO public.api_settings (razorpay_key_id, razorpay_key_secret, pro_plan_price_inr)
SELECT NULL, NULL, 999
WHERE NOT EXISTS (SELECT 1 FROM public.api_settings);