
-- Add video metadata columns to course_videos table
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'url';
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-videos', 
  'course-videos', 
  true, 
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
CREATE POLICY "Anyone can view course videos" ON storage.objects
FOR SELECT USING (bucket_id = 'course-videos');

CREATE POLICY "Admins can upload course videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update course videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete course videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'course-videos' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
