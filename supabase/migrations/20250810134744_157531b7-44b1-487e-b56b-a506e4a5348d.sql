-- Add course_id to user_learning table to track course-specific assessments
ALTER TABLE public.user_learning 
ADD COLUMN course_id UUID REFERENCES public.courses(id);

-- Drop the existing unique constraint on user_id only
ALTER TABLE public.user_learning 
DROP CONSTRAINT IF EXISTS user_learning_user_id_key;

-- Add composite unique constraint on user_id and course_id
ALTER TABLE public.user_learning 
ADD CONSTRAINT user_learning_user_id_course_id_key UNIQUE (user_id, course_id);

-- Update any existing records to have a course_id (set to NULL for now, will need manual data migration)
-- Make course_id NOT NULL after data migration
ALTER TABLE public.user_learning 
ALTER COLUMN course_id SET NOT NULL;