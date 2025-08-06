-- Add foreign key constraint from interview_reports to profiles table
ALTER TABLE public.interview_reports 
ADD CONSTRAINT fk_interview_reports_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security on interview_reports table
ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to view their own interview reports
CREATE POLICY "Users can view their own interview reports" 
ON public.interview_reports 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create RLS policy for users to insert their own interview reports
CREATE POLICY "Users can insert their own interview reports" 
ON public.interview_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for users to update their own interview reports
CREATE POLICY "Users can update their own interview reports" 
ON public.interview_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policy for admins to manage all interview reports
CREATE POLICY "Admins can manage all interview reports" 
ON public.interview_reports 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));

-- Update the default user_id to NULL instead of the placeholder UUID
ALTER TABLE public.interview_reports 
ALTER COLUMN user_id DROP DEFAULT;

-- Make user_id NOT NULL to ensure every report has a valid user
ALTER TABLE public.interview_reports 
ALTER COLUMN user_id SET NOT NULL;