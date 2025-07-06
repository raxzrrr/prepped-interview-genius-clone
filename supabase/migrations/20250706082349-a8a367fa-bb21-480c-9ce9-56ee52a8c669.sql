
-- Enable realtime for course_videos table
ALTER TABLE public.course_videos REPLICA IDENTITY FULL;

-- Add course_videos to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_videos;

-- Add course_videos to realtime publication for courses as well (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
