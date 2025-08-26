-- 1) Backfill missing profiles for existing user IDs referenced in learning/certificates
-- Ensure user_role type exists (already exists in this project)

-- Create minimal profiles for user_learning.user_id not present in profiles
INSERT INTO public.profiles (id, full_name, role, email, auth_provider)
SELECT DISTINCT ul.user_id, 'Learner', 'student'::user_role, NULL, 'clerk'
FROM public.user_learning ul
LEFT JOIN public.profiles p ON p.id = ul.user_id
WHERE p.id IS NULL AND ul.user_id IS NOT NULL;

-- Create minimal profiles for user_certificates.user_id not present in profiles
INSERT INTO public.profiles (id, full_name, role, email, auth_provider)
SELECT DISTINCT uc.user_id, 'Learner', 'student'::user_role, NULL, 'clerk'
FROM public.user_certificates uc
LEFT JOIN public.profiles p ON p.id = uc.user_id
WHERE p.id IS NULL AND uc.user_id IS NOT NULL;

-- 2) Helper functions for JWT email-based ownership checks
CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (current_setting('request.jwt.claims', true)::json ->> 'email')::text;
$$;

CREATE OR REPLACE FUNCTION public.is_owner_by_email(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = target_user_id
      AND COALESCE(p.email, '') = COALESCE(public.jwt_email(), '__none__')
  );
$$;

-- 3) Enable RLS and align policies to support both auth.uid() and email-based ownership
ALTER TABLE public.user_learning ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own learning data" ON public.user_learning;
DROP POLICY IF EXISTS "Users can insert their own learning data" ON public.user_learning;
DROP POLICY IF EXISTS "Users can update their own learning data" ON public.user_learning;

CREATE POLICY "Users can view their own learning data"
ON public.user_learning
FOR SELECT
USING (auth.uid() = user_id OR public.is_owner_by_email(user_id));

CREATE POLICY "Users can insert their own learning data"
ON public.user_learning
FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_owner_by_email(user_id));

CREATE POLICY "Users can update their own learning data"
ON public.user_learning
FOR UPDATE
USING (auth.uid() = user_id OR public.is_owner_by_email(user_id));

-- user_certificates: replace with email-aware policies
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all user certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.user_certificates;
DROP POLICY IF EXISTS "Users can update their own certificates" ON public.user_certificates;

-- Keep admin policy using existing function
CREATE POLICY "Admins can manage all user certificates"
ON public.user_certificates
AS PERMISSIVE
FOR ALL
USING (public.is_current_user_admin());

CREATE POLICY "Users can view their own certificates"
ON public.user_certificates
FOR SELECT
USING (auth.uid() = user_id OR public.is_owner_by_email(user_id));

CREATE POLICY "Users can insert their own certificates"
ON public.user_certificates
FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_owner_by_email(user_id));

CREATE POLICY "Users can update their own certificates"
ON public.user_certificates
FOR UPDATE
USING (auth.uid() = user_id OR public.is_owner_by_email(user_id));

-- 4) Add FK constraints now that profiles are backfilled
ALTER TABLE public.user_learning 
ADD CONSTRAINT IF NOT EXISTS fk_user_learning_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_certificates 
ADD CONSTRAINT IF NOT EXISTS fk_user_certificates_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5) Add helpful indexes and triggers
CREATE INDEX IF NOT EXISTS idx_user_learning_user_course ON public.user_learning(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id ON public.user_certificates(user_id);

-- updated_at trigger on user_learning if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_learning_updated_at'
  ) THEN
    CREATE TRIGGER update_user_learning_updated_at
    BEFORE UPDATE ON public.user_learning
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;