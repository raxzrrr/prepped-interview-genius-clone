-- Create a database function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION public.set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not provided, try to get it from auth context
  IF NEW.user_id IS NULL THEN
    NEW.user_id := COALESCE(
      auth.uid(), 
      public.get_current_clerk_user_id()
    );
  END IF;
  
  -- If still null, raise an error
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'User ID could not be determined. User must be authenticated.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to automatically set user_id on tables
DROP TRIGGER IF EXISTS set_user_id_trigger ON public.interview_sessions;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.user_interview_usage;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.user_interview_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.user_learning;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.user_learning
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

DROP TRIGGER IF EXISTS set_user_id_trigger ON public.interview_reports;
CREATE TRIGGER set_user_id_trigger
  BEFORE INSERT ON public.interview_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_insert();

-- Make user_id nullable in interview_sessions temporarily (the trigger will set it)
ALTER TABLE public.interview_sessions 
ALTER COLUMN user_id DROP NOT NULL;