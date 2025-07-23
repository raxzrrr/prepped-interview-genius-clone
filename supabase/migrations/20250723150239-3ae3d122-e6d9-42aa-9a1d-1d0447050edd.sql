-- Create interview_reports table for storing user interview reports
CREATE TABLE public.interview_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interview_type TEXT NOT NULL DEFAULT 'custom',
  job_role TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_score INTEGER NOT NULL DEFAULT 0,
  overall_grade TEXT NOT NULL DEFAULT 'F',
  recommendation TEXT NOT NULL DEFAULT '',
  report_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to profiles table
ALTER TABLE public.interview_reports 
ADD CONSTRAINT fk_interview_reports_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_reports table
CREATE POLICY "Users can view their own interview reports" 
ON public.interview_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview reports" 
ON public.interview_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview reports" 
ON public.interview_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview reports" 
ON public.interview_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_interview_reports_user_id ON public.interview_reports(user_id);
CREATE INDEX idx_interview_reports_created_at ON public.interview_reports(created_at DESC);
CREATE INDEX idx_interview_reports_user_created ON public.interview_reports(user_id, created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_interview_reports_updated_at
BEFORE UPDATE ON public.interview_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();