-- Create user_reports table for storing interview PDF reports
CREATE TABLE public.user_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_type text NOT NULL DEFAULT 'interview',
  title text NOT NULL,
  pdf_url text,
  pdf_data bytea,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_reports
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_reports
CREATE POLICY "Users can view their own reports" 
ON public.user_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.user_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports" 
ON public.user_reports 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));