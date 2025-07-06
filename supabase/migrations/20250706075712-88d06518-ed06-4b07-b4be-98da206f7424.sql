
-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.course_videos CASCADE;
DROP TABLE IF EXISTS public.course_categories CASCADE;

-- Create the main courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  thumbnail_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the course_videos table
CREATE TABLE public.course_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses (public read access, admin write access)
CREATE POLICY "Anyone can view active courses"
  ON public.courses
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for course_videos (public read access, admin write access)
CREATE POLICY "Anyone can view active course videos"
  ON public.course_videos
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage course videos"
  ON public.course_videos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_courses_order ON public.courses(order_index);
CREATE INDEX idx_courses_active ON public.courses(is_active);
CREATE INDEX idx_course_videos_course_id ON public.course_videos(course_id);
CREATE INDEX idx_course_videos_order ON public.course_videos(order_index);
CREATE INDEX idx_course_videos_active ON public.course_videos(is_active);

-- Insert the default courses
INSERT INTO public.courses (name, description, order_index) VALUES
('Cybersecurity', 'Learn cybersecurity fundamentals and best practices', 1),
('Networking', 'Master computer networking concepts and protocols', 2),
('Operating System', 'Understand operating system principles and internals', 3),
('Machine Learning', 'Introduction to machine learning algorithms and applications', 4),
('Artificial Intelligence', 'Explore AI concepts and practical implementations', 5),
('Python', 'Learn Python programming from basics to advanced', 6),
('Java', 'Master Java programming and object-oriented concepts', 7),
('C', 'Learn C programming language fundamentals', 8),
('DevOps', 'Master DevOps practices and tools', 9),
('Interview Master', 'Ace your technical interviews with expert guidance', 10);

-- Update user_learning table to work with the new course structure
ALTER TABLE public.user_learning ADD COLUMN IF NOT EXISTS course_progress_new JSONB DEFAULT '{}'::jsonb;

-- Create a function to migrate old progress data (if needed)
CREATE OR REPLACE FUNCTION migrate_course_progress()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be used later to migrate existing progress data
  -- For now, it's just a placeholder
  RAISE NOTICE 'Course progress migration function created';
END;
$$;
