
-- Create a table to store user learning data
CREATE TABLE IF NOT EXISTS public.user_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  course_progress JSONB DEFAULT '{}'::jsonb,
  course_progress_new JSONB DEFAULT '{}'::jsonb,
  completed_modules INT DEFAULT 0,
  total_modules INT DEFAULT 0,
  course_score INT,
  course_completed_at TIMESTAMP WITH TIME ZONE,
  assessment_attempted BOOLEAN DEFAULT false,
  assessment_score INT,
  assessment_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.user_learning ENABLE ROW LEVEL SECURITY;

-- Users can only view their own learning data
CREATE POLICY "Users can view their own learning data"
  ON public.user_learning
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own learning data
CREATE POLICY "Users can update their own learning data"
  ON public.user_learning
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only insert their own learning data
CREATE POLICY "Users can insert their own learning data"
  ON public.user_learning
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_learning_user_id ON public.user_learning (user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_learning_updated_at 
    BEFORE UPDATE ON public.user_learning 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
