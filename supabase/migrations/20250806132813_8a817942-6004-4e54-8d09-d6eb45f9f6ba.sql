-- Add assessment tracking columns to user_learning table
ALTER TABLE public.user_learning 
ADD COLUMN assessment_attempted boolean DEFAULT false,
ADD COLUMN assessment_passed boolean DEFAULT false,
ADD COLUMN assessment_score integer DEFAULT null,
ADD COLUMN assessment_completed_at timestamp with time zone DEFAULT null;