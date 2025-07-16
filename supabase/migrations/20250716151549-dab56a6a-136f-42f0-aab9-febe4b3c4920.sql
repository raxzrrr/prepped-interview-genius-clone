
-- Create a table for admin credentials
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for security
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy that allows admin operations (we'll manage this through application logic)
CREATE POLICY "Admin credentials access" 
  ON public.admin_credentials 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Insert default admin credentials (username: admin, password: admin)
INSERT INTO public.admin_credentials (username, password_hash) 
VALUES ('admin', crypt('admin', gen_salt('bf')));

-- Create function to authenticate admin
CREATE OR REPLACE FUNCTION public.authenticate_admin(
  admin_username TEXT,
  admin_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the password hash for the username
  SELECT password_hash INTO stored_hash 
  FROM public.admin_credentials 
  WHERE username = admin_username;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the password matches
  RETURN (stored_hash = crypt(admin_password, stored_hash));
END;
$$;

-- Create function to update admin credentials
CREATE OR REPLACE FUNCTION public.update_admin_credentials(
  old_username TEXT,
  old_password TEXT,
  new_username TEXT,
  new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First verify the old credentials
  IF NOT public.authenticate_admin(old_username, old_password) THEN
    RETURN FALSE;
  END IF;
  
  -- Update with new credentials
  UPDATE public.admin_credentials 
  SET 
    username = new_username,
    password_hash = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE username = old_username;
  
  RETURN TRUE;
END;
$$;
