-- Add foreign key constraints to ensure data integrity
ALTER TABLE public.user_learning 
ADD CONSTRAINT fk_user_learning_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_certificates 
ADD CONSTRAINT fk_user_certificates_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security on user_learning
ALTER TABLE public.user_learning ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_learning
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

-- Enable Row Level Security on user_certificates (if not already enabled)
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- Update existing user_certificates policies to be more specific
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Users can update their own certificates" ON public.user_certificates;

CREATE POLICY "Users can view their own certificates"
ON public.user_certificates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates"
ON public.user_certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificates"
ON public.user_certificates
FOR UPDATE
USING (auth.uid() = user_id);

-- Add updated_at trigger for user_learning
CREATE TRIGGER update_user_learning_updated_at
BEFORE UPDATE ON public.user_learning
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_learning_user_course 
ON public.user_learning(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id 
ON public.user_certificates(user_id);