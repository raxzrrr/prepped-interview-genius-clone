-- Create user_certificates table to track certificates earned by users
CREATE TABLE public.user_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  issued_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completion_data JSONB DEFAULT '{}'::jsonb,
  verification_code TEXT NOT NULL,
  certificate_url TEXT,
  score INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure a user can only have one certificate of each type
  UNIQUE(user_id, certificate_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for user certificates
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

-- Admins can manage all certificates
CREATE POLICY "Admins can manage all user certificates" 
ON public.user_certificates 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_certificates_updated_at
BEFORE UPDATE ON public.user_certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();