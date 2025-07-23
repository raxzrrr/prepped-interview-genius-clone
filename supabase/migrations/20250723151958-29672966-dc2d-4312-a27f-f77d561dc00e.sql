-- Add PDF storage column to interview_reports table
ALTER TABLE public.interview_reports 
ADD COLUMN pdf_url text;

-- Create storage bucket for interview report PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('interview-reports', 'interview-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for interview report PDFs
CREATE POLICY "Users can view their own report PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'interview-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "System can upload report PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'interview-reports');

CREATE POLICY "Users can update their own report PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'interview-reports' AND auth.uid()::text = (storage.foldername(name))[1]);