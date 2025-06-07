
import { supabase } from '@/integrations/supabase/client';

export interface UserLearningData {
  id: string;
  user_id: string;
  course_progress: Record<string, any>;
  completed_modules: number;
  total_modules: number;
  course_score: number | null;
  course_completed_at: string | null;
  assessment_attempted: boolean;
  assessment_score: number | null;
  assessment_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const learningService = {
  async fetchUserLearningData(clerkUserId: string, totalModules: number): Promise<UserLearningData | null> {
    try {
      const { data, error } = await supabase.functions.invoke('learning-service', {
        body: {
          action: 'fetch',
          clerkUserId,
          totalModules
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    } catch (error) {
      console.error('Error fetching learning data:', error);
      throw error;
    }
  },

  async updateModuleProgress(
    clerkUserId: string, 
    courseProgress: Record<string, any>, 
    completedModulesCount: number,
    totalModules: number
  ): Promise<UserLearningData> {
    try {
      // Check if interview course is completed
      const interviewCourseProgress = courseProgress['interview-mastery'] || {};
      const interviewModulesCompleted = Object.keys(interviewCourseProgress).filter(
        key => interviewCourseProgress[key] === true
      ).length;
      const isInterviewCourseComplete = interviewModulesCompleted >= 5;

      const updateData: any = {
        course_progress: courseProgress,
        completed_modules: completedModulesCount
      };

      if (isInterviewCourseComplete) {
        updateData.course_score = 85;
        updateData.course_completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase.functions.invoke('learning-service', {
        body: {
          action: 'update',
          clerkUserId,
          data: updateData
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    } catch (error) {
      console.error('Error updating module progress:', error);
      throw error;
    }
  },

  async updateAssessmentScore(clerkUserId: string, score: number): Promise<UserLearningData> {
    try {
      const { data, error } = await supabase.functions.invoke('learning-service', {
        body: {
          action: 'updateAssessment',
          clerkUserId,
          data: { score }
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    } catch (error) {
      console.error('Error updating assessment score:', error);
      throw error;
    }
  }
};
