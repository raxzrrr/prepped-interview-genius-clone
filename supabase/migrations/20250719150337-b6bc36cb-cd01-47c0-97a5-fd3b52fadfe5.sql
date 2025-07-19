-- Create course_questions table for course-specific assessment questions
CREATE TABLE public.course_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'intermediate', 'hard')),
  option_1 TEXT NOT NULL,
  option_2 TEXT NOT NULL,
  option_3 TEXT NOT NULL,
  option_4 TEXT NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 1 AND 4),
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.course_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for course questions
CREATE POLICY "Anyone can view active course questions" 
ON public.course_questions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage course questions" 
ON public.course_questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_course_questions_updated_at
BEFORE UPDATE ON public.course_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_course_questions_course_id ON public.course_questions(course_id);
CREATE INDEX idx_course_questions_difficulty ON public.course_questions(difficulty_level);
CREATE INDEX idx_course_questions_active ON public.course_questions(is_active);