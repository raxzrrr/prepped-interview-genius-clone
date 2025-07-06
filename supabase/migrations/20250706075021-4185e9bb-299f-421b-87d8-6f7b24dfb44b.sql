
-- Create course_categories table
CREATE TABLE public.course_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_videos table
CREATE TABLE public.course_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.course_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_progress column to user_learning table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_learning' AND column_name = 'category_progress') THEN
        ALTER TABLE public.user_learning ADD COLUMN category_progress JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Enable Row Level Security
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

-- Create indexes for better performance
CREATE INDEX idx_course_categories_order ON public.course_categories(order_index);
CREATE INDEX idx_course_videos_category_id ON public.course_videos(category_id);
CREATE INDEX idx_course_videos_order ON public.course_videos(order_index);

-- Insert some sample data for testing
INSERT INTO public.course_categories (name, description, order_index) VALUES
('Interview Mastery', 'Master technical interviews with comprehensive preparation', 1),
('System Design', 'Learn to design scalable systems', 2),
('Data Structures', 'Master fundamental data structures', 3),
('Algorithms', 'Essential algorithms for coding interviews', 4);

-- Insert sample videos for Interview Mastery category
INSERT INTO public.course_videos (category_id, title, description, video_url, duration, order_index)
SELECT 
  c.id,
  'Introduction to Technical Interviews',
  'Learn the basics of technical interview preparation',
  'https://example.com/video1',
  '15:30',
  1
FROM public.course_categories c WHERE c.name = 'Interview Mastery'
UNION ALL
SELECT 
  c.id,
  'Problem Solving Strategies',
  'Master different approaches to solving coding problems',
  'https://example.com/video2',
  '22:45',
  2
FROM public.course_categories c WHERE c.name = 'Interview Mastery'
UNION ALL
SELECT 
  c.id,
  'Communication Skills',
  'How to effectively communicate your solution',
  'https://example.com/video3',
  '18:20',
  3
FROM public.course_categories c WHERE c.name = 'Interview Mastery';
