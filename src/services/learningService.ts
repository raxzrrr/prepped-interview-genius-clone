import { supabase } from '@/integrations/supabase/client';

export interface UserLearningData {
  id?: string;
  user_id?: string;
  progress?: Record<string, any>;
  course_progress?: Record<string, any>; // For backwards compatibility
  course_progress_new?: Record<string, any>;
  completed_modules?: number; // For backwards compatibility
  completed_modules_count?: number;
  total_modules?: number; // For backwards compatibility
  total_modules_count?: number;
  last_assessment_score?: number;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  assessment_attempted?: boolean;
  assessment_passed?: boolean;
  assessment_score?: number;
  assessment_completed_at?: string;
  course_score?: number; // For backwards compatibility
  course_completed_at?: string; // For backwards compatibility
}

// Generate a consistent UUID from Clerk User ID
const generateConsistentUUID = (clerkUserId: string): string => {
  // Remove any prefix like "user_" if present
  const cleanId = clerkUserId.replace(/^user_/, '');
  
  // Pad or truncate to 32 characters
  const paddedId = cleanId.padEnd(32, '0').substring(0, 32);
  
  // Format as UUID
  return [
    paddedId.substring(0, 8),
    paddedId.substring(8, 12),
    paddedId.substring(12, 16),
    paddedId.substring(16, 20),
    paddedId.substring(20, 32)
  ].join('-');
};

export const learningService = {
  async fetchUserLearningData(clerkUserId: string, totalModules: number, courseId?: string): Promise<UserLearningData | null> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      
      const { data, error } = await supabase
        .from('user_learning')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching learning data:', error);
        throw error;
      }

      if (!data) {
        // Create new record if it doesn't exist (only if courseId is provided)
        if (!courseId) {
          return null; // Cannot create without courseId
        }
        
        const newRecord = {
          user_id: userId,
          course_id: courseId,
          progress: {},
          course_progress_new: {},
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
        course_progress_new: courseProgress,
        completed_modules_count: completedModulesCount,
        total_modules_count: totalModules,
        updated_at: new Date().toISOString()
      };

      // Try to update existing record
      const { data, error } = await supabase
        .from('user_learning')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error || !data) {
        // If no record exists, create one
        const newRecord = {
          user_id: userId,
          course_id: courseId,
          progress: {},
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
      
      const updateData = {
        assessment_attempted: true,
        assessment_passed: score >= 70,
        assessment_score: score,
        assessment_completed_at: score >= 70 ? new Date().toISOString() : null,
        last_assessment_score: score,
        updated_at: new Date().toISOString()
      };

      // Try to update existing record
      const { data, error } = await supabase
        .from('user_learning')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .maybeSingle();

      if (error || !data) {
        // If no record exists, create one
        const newRecord = {
          user_id: userId,
          course_id: courseId,
          progress: {},
          course_progress_new: {},
          completed_modules_count: 0,
          total_modules_count: 0,
          is_completed: false,
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