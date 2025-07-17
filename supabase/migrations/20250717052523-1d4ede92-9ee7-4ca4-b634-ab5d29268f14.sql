
-- User interview usage tracking
CREATE TABLE public.user_interview_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  free_interview_used BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_interview_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificate management
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  certificate_type TEXT DEFAULT 'completion',
  template_data JSONB DEFAULT '{}',
  requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  auto_issue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User certificates
CREATE TABLE public.user_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_data JSONB DEFAULT '{}',
  certificate_url TEXT,
  verification_code TEXT UNIQUE DEFAULT CONCAT('CERT-', UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8))),
  status TEXT DEFAULT 'issued',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Question banks for PDF generation
CREATE TABLE public.question_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology TEXT NOT NULL,
  category TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]',
  difficulty_level TEXT DEFAULT 'mixed',
  total_questions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.user_interview_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_banks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_interview_usage
CREATE POLICY "Users can view their own interview usage" 
  ON public.user_interview_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview usage" 
  ON public.user_interview_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview usage" 
  ON public.user_interview_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS Policies for certificates (admin can manage, users can view active ones)
CREATE POLICY "Anyone can view active certificates" 
  ON public.certificates 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage certificates" 
  ON public.certificates 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for user_certificates
CREATE POLICY "Users can view their own certificates" 
  ON public.user_certificates 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user certificates" 
  ON public.user_certificates 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can manage all user certificates" 
  ON public.user_certificates 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for question_banks
CREATE POLICY "Anyone can view active question banks" 
  ON public.question_banks 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage question banks" 
  ON public.question_banks 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- Insert some sample certificates
INSERT INTO public.certificates (title, description, certificate_type, auto_issue, requirements) VALUES
('Interview Completion Certificate', 'Certificate for completing interview practice sessions', 'completion', false, '{"min_interviews": 5, "min_score": 70}'),
('Internship Completion Certificate', 'Certificate for completing internship program', 'internship', false, '{"admin_approval": true}'),
('Excellence in Interview Skills', 'Certificate for achieving high scores in interview practice', 'excellence', true, '{"min_interviews": 10, "min_average_score": 85}');

-- Insert sample question banks
INSERT INTO public.question_banks (technology, category, questions, total_questions) VALUES
('React', 'Frontend Development', '[
  {"question": "What is JSX?", "answer": "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in React components."},
  {"question": "Explain the difference between state and props.", "answer": "State is internal component data that can change, while props are external data passed from parent components."},
  {"question": "What are React Hooks?", "answer": "Hooks are functions that let you use state and other React features in functional components."}
]', 100),
('Node.js', 'Backend Development', '[
  {"question": "What is Node.js?", "answer": "Node.js is a JavaScript runtime built on Chrome V8 engine for server-side development."},
  {"question": "Explain the event loop in Node.js.", "answer": "The event loop is the core mechanism that handles asynchronous operations in Node.js."}
]', 100),
('Python', 'Programming Languages', '[
  {"question": "What is Python?", "answer": "Python is a high-level, interpreted programming language known for its simplicity and readability."},
  {"question": "Explain list comprehension.", "answer": "List comprehension is a concise way to create lists in Python using a single line of code."}
]', 100);

-- Create indexes for better performance
CREATE INDEX idx_user_interview_usage_user_id ON public.user_interview_usage(user_id);
CREATE INDEX idx_user_certificates_user_id ON public.user_certificates(user_id);
CREATE INDEX idx_user_certificates_verification_code ON public.user_certificates(verification_code);
CREATE INDEX idx_question_banks_technology ON public.question_banks(technology);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_interview_usage_updated_at BEFORE UPDATE ON public.user_interview_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_certificates_updated_at BEFORE UPDATE ON public.user_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_question_banks_updated_at BEFORE UPDATE ON public.question_banks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
