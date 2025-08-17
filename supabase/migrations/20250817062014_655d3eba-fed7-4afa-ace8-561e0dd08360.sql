-- Create interview_resources table for storing PDF materials uploaded by admin
CREATE TABLE public.interview_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.interview_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for interview_resources
CREATE POLICY "Admins can manage interview resources" 
ON public.interview_resources 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow authenticated users (students) to view active resources
CREATE POLICY "Students can view active interview resources" 
ON public.interview_resources 
FOR SELECT 
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_interview_resources_updated_at
BEFORE UPDATE ON public.interview_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for interview resources
INSERT INTO storage.buckets (id, name, public) VALUES ('interview-resources', 'interview-resources', false);

-- Create storage policies for interview resources
CREATE POLICY "Admins can upload interview resources" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update interview resources" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete interview resources" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'interview-resources' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view interview resources" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'interview-resources' AND auth.role() = 'authenticated');