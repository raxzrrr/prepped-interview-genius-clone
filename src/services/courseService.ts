
import { supabase } from '@/integrations/supabase/client';

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  thumbnail_url?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseVideo {
  id: string;
  category_id: string;
  title: string;
  description: string;
  video_url: string;
  duration: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const courseService = {
  async fetchCategories(): Promise<CourseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('course_categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      throw error;
    }
  },

  async fetchVideosByCategory(categoryId: string): Promise<CourseVideo[]> {
    try {
      const { data, error } = await supabase
        .from('course_videos')
        .select('*')
        .eq('category_id', categoryId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchVideosByCategory:', error);
      throw error;
    }
  }
};
