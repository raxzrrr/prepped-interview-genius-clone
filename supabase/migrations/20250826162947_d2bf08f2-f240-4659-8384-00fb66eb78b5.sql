-- Enable RLS on the remaining tables that need it
ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for interview tables
CREATE POLICY "Users can view their own reports"
ON public.interview_reports
FOR ALL
USING (user_id = auth.uid() OR public.is_owner_by_email(user_id));

CREATE POLICY "Users can view their own sessions" 
ON public.interview_sessions
FOR ALL
USING (user_id = auth.uid() OR public.is_owner_by_email(user_id));