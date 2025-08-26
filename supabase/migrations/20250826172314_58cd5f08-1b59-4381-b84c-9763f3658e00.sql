
-- 1) Add course_id to user_certificates and link it to courses
ALTER TABLE public.user_certificates
  ADD COLUMN IF NOT EXISTS course_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_certificates_course_id_fkey'
  ) THEN
    ALTER TABLE public.user_certificates
      ADD CONSTRAINT user_certificates_course_id_fkey
      FOREIGN KEY (course_id)
      REFERENCES public.courses(id)
      ON DELETE SET NULL;
  END IF;
END$$;

-- 2) Ensure FK to certificates and helpful indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_certificates_certificate_id_fkey'
  ) THEN
    ALTER TABLE public.user_certificates
      ADD CONSTRAINT user_certificates_certificate_id_fkey
      FOREIGN KEY (certificate_id)
      REFERENCES public.certificates(id)
      ON DELETE RESTRICT;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id
  ON public.user_certificates(user_id);

CREATE INDEX IF NOT EXISTS idx_user_certificates_user_course
  ON public.user_certificates(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_certificates_certificate_id
  ON public.user_certificates(certificate_id);

-- 3) Computed column for authoritative UI state
ALTER TABLE public.user_learning
  ADD COLUMN IF NOT EXISTS completed_and_passed boolean
  GENERATED ALWAYS AS (
    COALESCE(is_completed, false) AND COALESCE(assessment_passed, false)
  ) STORED;

-- 3b) Add FK from user_learning.course_id to courses (helps integrity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_learning_course_id_fkey'
  ) THEN
    ALTER TABLE public.user_learning
      ADD CONSTRAINT user_learning_course_id_fkey
      FOREIGN KEY (course_id)
      REFERENCES public.courses(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_user_learning_user_course
  ON public.user_learning(user_id, course_id);

-- 3c) Ensure updated_at auto-updates on changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_learning_set_updated_at'
  ) THEN
    CREATE TRIGGER user_learning_set_updated_at
    BEFORE UPDATE ON public.user_learning
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_certificates_set_updated_at'
  ) THEN
    CREATE TRIGGER user_certificates_set_updated_at
    BEFORE UPDATE ON public.user_certificates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 4) View that "merges" user_certificates with certificates for simpler fetching
CREATE OR REPLACE VIEW public.v_user_certificates AS
SELECT
  uc.id,
  uc.user_id,
  uc.course_id,
  uc.certificate_id,
  uc.template_id,
  uc.issued_date,
  uc.score,
  uc.is_active,
  uc.certificate_url,
  uc.populated_html,
  uc.verification_code,
  uc.completion_data,
  uc.created_at,
  uc.updated_at,
  c.title  AS certificate_title,
  c.description AS certificate_description,
  c.certificate_type,
  c.is_active AS certificate_is_active
FROM public.user_certificates uc
LEFT JOIN public.certificates c
  ON c.id = uc.certificate_id;
