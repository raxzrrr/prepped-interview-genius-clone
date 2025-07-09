import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseVideo {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: string;
  order_index: number;
  is_active: boolean;
  content_type?: string;
  file_path?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export const courseService = {
  async fetchCourses(): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching courses:', error);
        throw new Error(`Failed to fetch courses: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchCourses:', error);
      throw error;
    }
  },

  async fetchVideosByCourse(courseId: string): Promise<CourseVideo[]> {
    try {
      const { data, error } = await supabase
        .from('course_videos')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error(`Error fetching videos for course ${courseId}:`, error);
        throw new Error(`Failed to fetch videos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchVideosByCourse:', error);
      throw error;
    }
  },

  async addCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    try {
      console.log('Adding course:', course);
      
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select('*')
        .single();

      if (error) {
        console.error('Error adding course:', error);
        throw new Error(`Failed to add course: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in addCourse:', error);
      throw error;
    }
  },

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    try {
      console.log(`Updating course ${courseId} with:`, updates);
      
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating course:', error);
        throw new Error(`Failed to update course: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateCourse:', error);
      throw error;
    }
  },

  async addVideo(video: Omit<CourseVideo, 'id' | 'created_at' | 'updated_at'>): Promise<CourseVideo> {
    try {
      console.log('Adding video:', video);
      
      const { data, error } = await supabase
        .from('course_videos')
        .insert(video)
        .select('*')
        .single();

      if (error) {
        console.error('Error adding video:', error);
        throw new Error(`Failed to add video: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in addVideo:', error);
      throw error;
    }
  },

  async updateVideo(videoId: string, updates: Partial<CourseVideo>): Promise<CourseVideo> {
    try {
      console.log(`Updating video ${videoId} with:`, updates);
      
      const { data, error } = await supabase
        .from('course_videos')
        .update(updates)
        .eq('id', videoId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating video:', error);
        throw new Error(`Failed to update video: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateVideo:', error);
      throw error;
    }
  },

  async deleteVideo(videoId: string): Promise<void> {
    try {
      console.log('Deleting video with ID:', videoId);
      
      // First get the video details to check if it has a file to delete
      const { data: video, error: fetchError } = await supabase
        .from('course_videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error('Error fetching video before deletion:', fetchError);
        throw new Error(`Failed to fetch video: ${fetchError.message}`);
      }

      // If video has a file path, delete it from storage
      if (video.file_path && video.content_type === 'file') {
        console.log('Deleting file from storage:', video.file_path);
        const { error: storageError } = await supabase.storage
          .from('course-videos')
          .remove([video.file_path]);

        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Don't throw here, continue with database deletion
        }
      }

      // Delete the video record from database
      const { error: deleteError } = await supabase
        .from('course_videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) {
        console.error('Error deleting video from database:', deleteError);
        throw new Error(`Failed to delete video: ${deleteError.message}`);
      }

      console.log('Video deleted successfully');
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      throw error;
    }
  },

  async deleteCourse(courseId: string): Promise<void> {
    try {
      console.log('Deleting course with ID:', courseId);
      
      // Delete the course record from database
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (deleteError) {
        console.error('Error deleting course from database:', deleteError);
        throw new Error(`Failed to delete course: ${deleteError.message}`);
      }

      console.log('Course deleted successfully');
    } catch (error) {
      console.error('Error in deleteCourse:', error);
      throw error;
    }
  }
};
