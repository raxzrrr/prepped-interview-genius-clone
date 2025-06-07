
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

const invokeFunction = async (functionName: string, body: any, retries = 2): Promise<any> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Invoking ${functionName}, attempt ${attempt + 1}/${retries + 1}`, body);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body
      });

      if (error) {
        console.error(`Function ${functionName} error:`, error);
        if (error.message?.includes('Failed to fetch')) {
          throw new Error('Network error - function not reachable');
        }
        throw error;
      }
      
      if (!data?.success) {
        console.error(`Function ${functionName} returned error:`, data?.error);
        throw new Error(data?.error || 'Unknown function error');
      }
      
      console.log(`Function ${functionName} success:`, data.data);
      return data;
    } catch (error) {
      console.error(`Function ${functionName} attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

export const learningService = {
  async fetchUserLearningData(clerkUserId: string, totalModules: number): Promise<UserLearningData | null> {
    try {
      const data = await invokeFunction('learning-service', {
        action: 'fetch',
        clerkUserId,
        totalModules
      });
      
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
        completed_modules: completedModulesCount,
        total_modules: totalModules
      };

      if (isInterviewCourseComplete) {
        updateData.course_score = 85;
        updateData.course_completed_at = new Date().toISOString();
      }

      const data = await invokeFunction('learning-service', {
        action: 'update',
        clerkUserId,
        data: updateData
      });
      
      return data.data;
    } catch (error) {
      console.error('Error updating module progress:', error);
      throw error;
    }
  },

  async updateAssessmentScore(clerkUserId: string, score: number): Promise<UserLearningData> {
    try {
      const data = await invokeFunction('learning-service', {
        action: 'updateAssessment',
        clerkUserId,
        data: { score }
      });
      
      return data.data;
    } catch (error) {
      console.error('Error updating assessment score:', error);
      throw error;
    }
  }
};
