-- Remove all RLS policies from interview-related tables
ALTER TABLE public.interview_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interview_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_reports DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can create their own interview sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can update their own interview sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can view their own interview sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can delete their own interview sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "Users can manage their own interview usage" ON public.user_interview_usage;
DROP POLICY IF EXISTS "Users can manage their own learning data" ON public.user_learning;
DROP POLICY IF EXISTS "Users can manage their own interview reports" ON public.interview_reports;

-- Remove triggers that set user_id
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.interview_sessions;
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.user_interview_usage;
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.user_learning;
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.interview_reports;

-- Drop functions we no longer need
DROP FUNCTION IF EXISTS public.set_user_id_on_insert();
DROP FUNCTION IF EXISTS public.get_current_clerk_user_id();

-- Make user_id nullable in all tables (make it optional)
ALTER TABLE public.interview_sessions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.user_interview_usage ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.user_learning ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.interview_reports ALTER COLUMN user_id DROP NOT NULL;

-- Set default values for user_id (use a generic UUID)
ALTER TABLE public.interview_sessions ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.user_interview_usage ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.user_learning ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.interview_reports ALTER COLUMN user_id SET DEFAULT '00000000-0000-0000-0000-000000000001';