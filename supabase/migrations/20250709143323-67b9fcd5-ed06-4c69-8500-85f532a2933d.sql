
-- Add foreign key constraint to connect course_videos with courses
ALTER TABLE course_videos 
ADD CONSTRAINT course_videos_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
