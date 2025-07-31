-- Create interview sessions table to store question sets with ideal answers
CREATE TABLE public.interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('basic_hr_technical', 'role_based', 'resume_based')),
  question_count INTEGER NOT NULL CHECK (question_count >= 5 AND question_count <= 10),
  job_role TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ideal_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  user_answers JSONB DEFAULT '[]'::jsonb,
  evaluations JSONB DEFAULT '[]'::jsonb,
  overall_score INTEGER DEFAULT 0,
  session_status TEXT NOT NULL DEFAULT 'created' CHECK (session_status IN ('created', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for interview sessions
CREATE POLICY "Users can view their own interview sessions" 
ON public.interview_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interview sessions" 
ON public.interview_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions" 
ON public.interview_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview sessions" 
ON public.interview_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_interview_sessions_updated_at
BEFORE UPDATE ON public.interview_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();