
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
  description: string;
  video_url: string;
  duration: string;
  order_index: number;
  is_active: boolean;
  content_type: string;
  file_path?: string;
  file_size?: number;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AddVideoData {
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  order_index: number;
  is_active: boolean;
  content_type: string;
  file_path?: string;
  file_size?: number;
  thumbnail_url?: string;
}

export const courseService = {
  async fetchCourses(): Promise<Course[]> {
    try {
      console.log('Fetching courses from database...');
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} courses`);
      return data || [];
    } catch (error) {
      console.error('Error in fetchCourses:', error);
      throw error;
    }
  },

  async fetchVideosByCourse(courseId: string): Promise<CourseVideo[]> {
    try {
      console.log(`Fetching videos for course: ${courseId}`);
      
      const { data, error } = await supabase
        .from('course_videos')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} videos for course ${courseId}`);
      return data || [];
    } catch (error) {
      console.error('Error in fetchVideosByCourse:', error);
      throw error;
    }
  },

  async addCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    try {
      console.log('Adding course to database:', course);
      
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select()
        .single();

      if (error) {
        console.error('Error adding course:', error);
        throw error;
      }

      console.log('Successfully added course:', data);
      return data;
    } catch (error) {
      console.error('Error in addCourse:', error);
      throw error;
    }
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    try {
      console.log(`Updating course ${id}:`, updates);
      
      const { data, error } = await supabase
        .from('courses')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating course:', error);
        throw error;
      }

      console.log('Successfully updated course:', data);
      return data;
    } catch (error) {
      console.error('Error in updateCourse:', error);
      throw error;
    }
  },

  async deleteCourse(id: string): Promise<void> {
    try {
      console.log(`Deleting course: ${id}`);
      
      const { error } = await supabase
        .from('courses')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting course:', error);
        throw error;
      }

      console.log('Successfully deleted course');
    } catch (error) {
      console.error('Error in deleteCourse:', error);
      throw error;
    }
  },

  async addVideo(video: AddVideoData): Promise<CourseVideo> {
    try {
      console.log('Adding video to database:', video);
      
      const { data, error } = await supabase
        .from('course_videos')
        .insert(video)
        .select()
        .single();

      if (error) {
        console.error('Error adding video:', error);
        console.error('Video data that failed:', video);
        throw error;
      }

      console.log('Successfully added video:', data);
      return data;
    } catch (error) {
      console.error('Error in addVideo:', error);
      throw error;
    }
  },

  async updateVideo(id: string, updates: Partial<CourseVideo>): Promise<CourseVideo> {
    try {
      console.log(`Updating video ${id}:`, updates);
      
      const { data, error } = await supabase
        .from('course_videos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating video:', error);
        throw error;
      }

      console.log('Successfully updated video:', data);
      return data;
    } catch (error) {
      console.error('Error in updateVideo:', error);
      throw error;
    }
  },

  async deleteVideo(id: string): Promise<void> {
    try {
      console.log(`Deleting video: ${id}`);
      
      const { error } = await supabase
        .from('course_videos')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deleting video:', error);
        throw error;
      }

      console.log('Successfully deleted video');
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      throw error;
    }
  }
};
