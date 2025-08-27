-- Enable realtime for user_certificates table
ALTER TABLE public.user_certificates REPLICA IDENTITY FULL;

-- Add user_certificates to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_certificates;

-- Enable realtime for interview_reports table  
ALTER TABLE public.interview_reports REPLICA IDENTITY FULL;

-- Add interview_reports to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.interview_reports;

-- Enable realtime for user_interview_usage table
ALTER TABLE public.user_interview_usage REPLICA IDENTITY FULL;

-- Add user_interview_usage to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interview_usage;