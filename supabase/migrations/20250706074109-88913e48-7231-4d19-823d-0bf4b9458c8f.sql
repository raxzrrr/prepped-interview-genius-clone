
-- Create course categories table
CREATE TABLE public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create course videos table
CREATE TABLE public.course_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.course_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_categories (public read access)
CREATE POLICY "Anyone can view course categories" 
  ON public.course_categories 
  FOR SELECT 
  USING (true);

-- Create RLS policies for course_videos (public read access)
CREATE POLICY "Anyone can view course videos" 
  ON public.course_videos 
  FOR SELECT 
  USING (true);

-- Insert initial course categories
INSERT INTO public.course_categories (name, description, order_index) VALUES
('Cybersecurity', 'Learn about network security, ethical hacking, and cybersecurity fundamentals', 1),
('Networking', 'Master computer networks, protocols, and network administration', 2),
('Operating System', 'Understand OS concepts, system administration, and kernel programming', 3),
('Machine Learning', 'Explore ML algorithms, data science, and predictive modeling', 4),
('Artificial Intelligence', 'Dive into AI concepts, neural networks, and deep learning', 5),
('Python', 'Master Python programming from basics to advanced concepts', 6),
('Java', 'Learn Java programming, OOP concepts, and enterprise development', 7),
('C', 'Understand C programming, memory management, and system programming', 8),
('DevOps', 'Learn CI/CD, containerization, cloud computing, and automation', 9),
('Interview Preparation', 'Technical and behavioral interview preparation courses', 10);

-- Update user_learning table to support category-based progress
ALTER TABLE public.user_learning 
ADD COLUMN IF NOT EXISTS category_progress JSONB DEFAULT '{}';

-- Migrate existing course progress to new structure
UPDATE public.user_learning 
SET category_progress = jsonb_build_object('interview-preparation', COALESCE(course_progress, '{}'))
WHERE course_progress IS NOT NULL AND course_progress != '{}';
