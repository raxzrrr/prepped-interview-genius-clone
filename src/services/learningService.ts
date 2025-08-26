
import { supabase } from '@/integrations/supabase/client';
import { generateConsistentUUID } from '@/utils/userUtils';

export interface UserLearningData {
  id?: string;
  user_id?: string;
  course_id?: string;
  progress?: Record<string, any>;
  completed_modules_count?: number;
  total_modules_count?: number;
  last_assessment_score?: number;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  assessment_attempted?: boolean;
  assessment_passed?: boolean;
  assessment_score?: number;
  assessment_completed_at?: string;
  completed_and_passed?: boolean; // New computed column
}

export const learningService = {
  async fetchUserLearningData(clerkUserId: string, totalModules: number, courseId: string): Promise<UserLearningData | null> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      
      const { data, error } = await supabase
        .from('user_learning')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching learning data:', error);
        throw error;
      }

      if (!data) {
        // Create new record if it doesn't exist
        const newRecord = {
          user_id: userId,
          course_id: courseId,
          progress: {},
          completed_modules_count: 0,
          total_modules_count: totalModules,
          last_assessment_score: 0,
          is_completed: false,
          assessment_attempted: false,
          assessment_passed: false,
          assessment_score: null,
          assessment_completed_at: null
        };

        const { data: createdData, error: createError } = await supabase
          .from('user_learning')
          .insert([newRecord])
          .select()
          .single();

        if (createError) {
          console.error('Error creating learning record:', createError);
          throw createError;
        }

        return createdData as UserLearningData;
      }
      
      return data as UserLearningData;
    } catch (error) {
      console.error('Error in fetchUserLearningData:', error);
      return null;
    }
  },

  async updateModuleProgress(
    clerkUserId: string,
    courseId: string,
    courseProgress: Record<string, any>,
    completedModulesCount: number,
    totalModules: number
  ): Promise<UserLearningData> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      
      const updateData = {
        progress: courseProgress,
        completed_modules_count: completedModulesCount,
        total_modules_count: totalModules,
        updated_at: new Date().toISOString()
      };

      // Try to update existing record
      const { data, error } = await supabase
        .from('user_learning')
        .update(updateData)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .select()
        .maybeSingle();

      if (error || !data) {
        // If no record exists, create one
        const newRecord = {
          user_id: userId,
          course_id: courseId,
          ...updateData,
          last_assessment_score: 0,
          is_completed: false,
          assessment_attempted: false,
          assessment_passed: false,
          assessment_score: null,
          assessment_completed_at: null
        };

        const { data: createdData, error: createError } = await supabase
          .from('user_learning')
          .insert([newRecord])
          .select()
          .single();

        if (createError) {
          console.error('Error creating learning record:', createError);
          throw createError;
        }

        return createdData as UserLearningData;
      }
      
      return data as UserLearningData;
    } catch (error) {
      console.error('Error updating module progress:', error);
      throw error;
    }
  },

  async updateAssessmentScore(clerkUserId: string, courseId: string, score: number): Promise<UserLearningData> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      const passed = score >= 70;
      
      const updateData = {
        assessment_attempted: true,
        assessment_passed: passed,
        assessment_score: score,
        assessment_completed_at: passed ? new Date().toISOString() : null,
        is_completed: passed, // Mark course as completed if assessment passed
        last_assessment_score: score,
        updated_at: new Date().toISOString()
      };

      // Try to update existing record
      const { data, error } = await supabase
        .from('user_learning')
        .update(updateData)
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .select()
        .maybeSingle();

      if (error || !data) {
        // If no record exists, create one
        const newRecord = {
          user_id: userId,
          course_id: courseId,
          progress: {},
          completed_modules_count: 0,
          total_modules_count: 0,
          ...updateData
        };

        const { data: createdData, error: createError } = await supabase
          .from('user_learning')
          .insert([newRecord])
          .select()
          .single();

        if (createError) {
          console.error('Error creating learning record:', createError);
          throw createError;
        }

        return createdData as UserLearningData;
      }
      
      return data as UserLearningData;
    } catch (error) {
      console.error('Error updating assessment score:', error);
      throw error;
    }
  }
};
