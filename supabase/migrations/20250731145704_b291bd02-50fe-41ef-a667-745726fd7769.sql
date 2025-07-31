-- Create the missing user_learning table that the learning-service function expects
CREATE TABLE public.user_learning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  progress JSONB DEFAULT '{}',
  completed_modules_count INTEGER DEFAULT 0,
  total_modules_count INTEGER DEFAULT 0,
  last_assessment_score INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_learning ENABLE ROW LEVEL SECURITY;

-- Create policies for user_learning
CREATE POLICY "Users can view their own learning data" 
ON public.user_learning 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning data" 
ON public.user_learning 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning data" 
ON public.user_learning 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_learning_updated_at
BEFORE UPDATE ON public.user_learning
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();