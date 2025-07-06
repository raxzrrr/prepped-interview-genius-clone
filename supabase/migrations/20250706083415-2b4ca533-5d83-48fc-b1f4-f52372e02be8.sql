
-- Insert the video into the course_videos table for the Cybersecurity course
INSERT INTO public.course_videos (
  course_id, 
  title, 
  description, 
  video_url, 
  order_index,
  is_active
)
SELECT 
  c.id,
  'Roadmap',
  'A comprehensive roadmap to guide your cybersecurity learning journey, covering essential skills and career paths in the field.',
  'https://youtu.be/vK4Mno4QYqk?si=GTkSExb0qy2oxsYH',
  1,
  true
FROM public.courses c
WHERE LOWER(c.name) = 'cybersecurity'
AND c.is_active = true;
