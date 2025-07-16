
-- Add API keys columns to the profiles table (more efficient than creating separate table)
ALTER TABLE public.profiles 
ADD COLUMN gemini_api_key TEXT,
ADD COLUMN google_tts_api_key TEXT;

-- Update the profiles table to handle manual authentication
ALTER TABLE public.profiles 
ADD COLUMN password_hash TEXT,
ADD COLUMN email_verified BOOLEAN DEFAULT false,
ADD COLUMN auth_provider TEXT DEFAULT 'clerk';

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update RLS policies to allow profile updates for API keys and settings
CREATE POLICY "Users can update their own API keys and settings" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id OR id = ANY(
  SELECT p.id FROM public.profiles p WHERE p.email = (
    SELECT email FROM public.profiles WHERE id = auth.uid()
  )
));

-- Create a function to handle manual user authentication
CREATE OR REPLACE FUNCTION public.authenticate_user(
  user_email TEXT,
  user_password TEXT
)
RETURNS TABLE(
  user_id UUID,
  user_data JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record public.profiles;
  password_valid BOOLEAN;
BEGIN
  -- Find user by email
  SELECT * INTO user_record 
  FROM public.profiles 
  WHERE email = user_email 
  AND auth_provider IN ('manual', 'clerk');
  
  IF user_record IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- For clerk users, allow login without password check
  IF user_record.auth_provider = 'clerk' THEN
    password_valid := true;
  ELSE
    -- Check password for manual users
    password_valid := (user_record.password_hash = crypt(user_password, user_record.password_hash));
  END IF;
  
  IF NOT password_valid THEN
    RAISE EXCEPTION 'Invalid credentials';
  END IF;
  
  -- Return user data
  RETURN QUERY SELECT 
    user_record.id,
    json_build_object(
      'id', user_record.id,
      'email', user_record.email,
      'full_name', user_record.full_name,
      'role', user_record.role,
      'auth_provider', user_record.auth_provider
    );
END;
$$;

-- Create function to register manual users
CREATE OR REPLACE FUNCTION public.register_manual_user(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'student'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  existing_user public.profiles;
BEGIN
  -- Check if user already exists
  SELECT * INTO existing_user 
  FROM public.profiles 
  WHERE email = user_email;
  
  IF existing_user IS NOT NULL THEN
    -- If user exists from Clerk, update to allow manual login
    IF existing_user.auth_provider = 'clerk' THEN
      UPDATE public.profiles 
      SET 
        password_hash = crypt(user_password, gen_salt('bf')),
        auth_provider = 'both'
      WHERE email = user_email;
      
      RETURN existing_user.id;
    ELSE
      RAISE EXCEPTION 'User already exists';
    END IF;
  END IF;
  
  -- Create new user
  new_user_id := gen_random_uuid();
  
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    password_hash,
    auth_provider,
    email_verified
  ) VALUES (
    new_user_id,
    user_email,
    user_full_name,
    user_role::user_role,
    crypt(user_password, gen_salt('bf')),
    'manual',
    false
  );
  
  RETURN new_user_id;
END;
$$;

-- Enable the pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;
