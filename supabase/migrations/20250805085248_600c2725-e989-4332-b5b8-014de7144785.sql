-- Create certificate_templates table
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html_template TEXT NOT NULL,
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on certificate_templates
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for certificate_templates
CREATE POLICY "Admins can manage certificate templates" 
ON public.certificate_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'::user_role
));

CREATE POLICY "Anyone can view active certificate templates" 
ON public.certificate_templates 
FOR SELECT 
USING (is_active = true);

-- Add company_name to admin_credentials for editable company name
ALTER TABLE public.admin_credentials 
ADD COLUMN company_name TEXT DEFAULT 'cyrobox solutions';

-- Update existing user_certificates table to include template_id and enhance security
ALTER TABLE public.user_certificates 
ADD COLUMN template_id UUID REFERENCES public.certificate_templates(id),
ADD COLUMN populated_html TEXT,
ADD COLUMN certificate_hash TEXT UNIQUE;

-- Create function to generate certificate hash for anti-tampering
CREATE OR REPLACE FUNCTION public.generate_certificate_hash(
  user_id UUID,
  template_id UUID,
  completion_data JSONB,
  issued_date TIMESTAMP WITH TIME ZONE
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(
    digest(
      user_id::text || template_id::text || completion_data::text || issued_date::text || 'certificate_salt_2024',
      'sha256'
    ),
    'hex'
  );
END;
$$;

-- Create function to populate certificate template with user data
CREATE OR REPLACE FUNCTION public.populate_certificate_template(
  template_id UUID,
  user_id UUID,
  course_name TEXT,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_html TEXT;
  user_name TEXT;
  company_name TEXT;
  populated_html TEXT;
BEGIN
  -- Get template HTML
  SELECT html_template INTO template_html
  FROM public.certificate_templates
  WHERE id = template_id AND is_active = true;
  
  IF template_html IS NULL THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;
  
  -- Get user name
  SELECT full_name INTO user_name
  FROM public.profiles
  WHERE id = user_id;
  
  IF user_name IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get company name from admin credentials
  SELECT admin_credentials.company_name INTO company_name
  FROM public.admin_credentials
  LIMIT 1;
  
  IF company_name IS NULL THEN
    company_name := 'cyrobox solutions';
  END IF;
  
  -- Replace placeholders in template
  populated_html := template_html;
  populated_html := REPLACE(populated_html, '{{user_name}}', user_name);
  populated_html := REPLACE(populated_html, '{{course_name}}', course_name);
  populated_html := REPLACE(populated_html, '{{completion_date}}', TO_CHAR(completion_date, 'Month DD, YYYY'));
  populated_html := REPLACE(populated_html, '{{company_name}}', company_name);
  
  IF score IS NOT NULL THEN
    populated_html := REPLACE(populated_html, '{{score}}', score::TEXT || '%');
  ELSE
    populated_html := REPLACE(populated_html, '{{score}}', 'N/A');
  END IF;
  
  RETURN populated_html;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default certificate template
INSERT INTO public.certificate_templates (name, description, html_template, placeholders, is_default) VALUES (
  'Professional Certificate',
  'Default professional certificate template',
  '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Achievement</title>
    <style>
        body {
            font-family: "Times New Roman", serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .certificate {
            background: white;
            width: 800px;
            padding: 60px;
            border: 10px solid #2c3e50;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            position: relative;
        }
        .certificate::before {
            content: "";
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #3498db;
            border-radius: 5px;
        }
        .header {
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            color: #2c3e50;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 10px;
        }
        .certificate-title {
            font-size: 36px;
            color: #34495e;
            font-weight: bold;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .subtitle {
            font-size: 18px;
            color: #7f8c8d;
            margin-bottom: 40px;
        }
        .recipient-name {
            font-size: 42px;
            color: #2980b9;
            font-weight: bold;
            margin: 30px 0;
            text-decoration: underline;
            text-decoration-color: #3498db;
        }
        .course-info {
            font-size: 20px;
            color: #34495e;
            margin: 30px 0;
            line-height: 1.6;
        }
        .completion-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #ecf0f1;
        }
        .date {
            font-size: 16px;
            color: #7f8c8d;
        }
        .signature {
            text-align: center;
        }
        .signature-line {
            border-bottom: 2px solid #34495e;
            width: 200px;
            margin: 20px auto 10px auto;
        }
        .signature-text {
            font-size: 14px;
            color: #7f8c8d;
        }
        .score {
            font-size: 18px;
            color: #27ae60;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            <div class="company-name">{{company_name}}</div>
            <div class="certificate-title">Certificate of Achievement</div>
            <div class="subtitle">This is to certify that</div>
        </div>
        
        <div class="recipient-name">{{user_name}}</div>
        
        <div class="course-info">
            has successfully completed the course<br>
            <strong>{{course_name}}</strong>
        </div>
        
        <div class="score">Final Score: {{score}}</div>
        
        <div class="completion-details">
            <div class="date">
                Date of Completion:<br>
                <strong>{{completion_date}}</strong>
            </div>
            <div class="signature">
                <div class="signature-line"></div>
                <div class="signature-text">Authorized Signature</div>
            </div>
        </div>
    </div>
</body>
</html>',
  '["user_name", "course_name", "completion_date", "company_name", "score"]'::jsonb,
  true
);