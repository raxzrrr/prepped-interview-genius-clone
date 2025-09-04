-- Enable RLS on tables that are missing it
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for the tables

-- Course categories - public read, admin manage
CREATE POLICY "Anyone can view course categories" 
ON public.course_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage course categories" 
ON public.course_categories 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Course videos - public read, admin manage
CREATE POLICY "Anyone can view course videos" 
ON public.course_videos 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage course videos" 
ON public.course_videos 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Courses - public read, admin manage
CREATE POLICY "Anyone can view courses" 
ON public.courses 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage courses" 
ON public.courses 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Interview sessions - users can manage their own, admins can manage all
CREATE POLICY "Users can view their own interview sessions" 
ON public.interview_sessions 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can insert their own interview sessions" 
ON public.interview_sessions 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can update their own interview sessions" 
ON public.interview_sessions 
FOR UPDATE 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Admins can manage all interview sessions" 
ON public.interview_sessions 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- User certificates - users can view their own, admins can manage all
CREATE POLICY "Users can view their own certificates" 
ON public.user_certificates 
FOR SELECT 
USING ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Users can insert their own certificates" 
ON public.user_certificates 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) OR is_owner_by_email(user_id));

CREATE POLICY "Admins can manage all certificates" 
ON public.user_certificates 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Fix function search paths
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.jwt_email()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT (current_setting('request.jwt.claims', true)::json ->> 'email')::text;
$$;

CREATE OR REPLACE FUNCTION public.is_owner_by_email(target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = target_user_id
      AND COALESCE(p.email, '') = COALESCE(public.jwt_email(), '__none__')
  );
$$;

CREATE OR REPLACE FUNCTION public.authenticate_admin(admin_username text, admin_password text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $$
BEGIN
  -- Check if the provided credentials match an admin user
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE (email = admin_username OR full_name = admin_username)
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_api_keys()
RETURNS TABLE (
  razorpay_key_id text,
  razorpay_key_secret text,
  pro_plan_price_inr integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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