
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { generateConsistentUUID } from '@/utils/userUtils';
import { useToast } from '@/components/ui/use-toast';

interface UserLearningData {
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

export const useLearningData = (totalModules: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userLearningData, setUserLearningData] = useState<UserLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserLearningData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const supabaseUUID = generateConsistentUUID(user.id);
      
      console.log('Fetching learning data for user:', supabaseUUID);
      
      const { data: existingData, error } = await supabase
        .from('user_learning')
        .select('*')
        .eq('user_id', supabaseUUID)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (existingData) {
        console.log('Found existing learning data:', existingData);
        setUserLearningData({
          ...existingData,
          course_progress: existingData.course_progress as Record<string, any> || {}
        });
      } else {
        console.log('Creating new learning data for user');
        const newLearningData = {
          user_id: supabaseUUID,
          course_progress: {},
          completed_modules: 0,
          total_modules: totalModules
        };
        
        const { data: createdData, error: createError } = await supabase
          .from('user_learning')
          .insert(newLearningData)
          .select('*')
          .single();
        
        if (createError) {
          console.error('Error creating learning data:', createError);
          throw createError;
        }
        
        if (createdData) {
          console.log('Created new learning data:', createdData);
          setUserLearningData({
            ...createdData,
            course_progress: createdData.course_progress as Record<string, any> || {}
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching user learning data:', err);
      setError(err.message);
      toast({
        title: "Learning Data Error",
        description: "Failed to load your learning progress. This might be due to authentication issues.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, totalModules, toast]);

  const updateModuleCompletion = useCallback(async (moduleId: string, courseId: string) => {
    if (!userLearningData || !user?.id) {
      console.error('No user learning data or user ID available');
      return false;
    }

    try {
      console.log('Updating module completion:', { moduleId, courseId });
      
      const courseProgress = {
        ...(userLearningData.course_progress || {}),
      };
      
      if (!courseProgress[courseId]) {
        courseProgress[courseId] = {};
      }
      
      courseProgress[courseId][moduleId] = true;
      
      let completedModulesCount = 0;
      Object.values(courseProgress).forEach(course => {
        if (course) {
          Object.values(course as Record<string, boolean>).forEach(completed => {
            if (completed) completedModulesCount++;
          });
        }
      });

      const supabaseUserId = generateConsistentUUID(user.id);
      
      console.log('Updating learning progress in database');
      
      const { error } = await supabase
        .from('user_learning')
        .update({
          course_progress: courseProgress,
          completed_modules: completedModulesCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', supabaseUserId);
      
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      console.log('Successfully updated learning progress');
      
      setUserLearningData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          course_progress: courseProgress,
          completed_modules: completedModulesCount
        };
      });

      toast({
        title: "Progress Saved",
        description: "Your learning progress has been updated.",
      });

      return true;
    } catch (err: any) {
      console.error('Error updating module completion:', err);
      toast({
        title: "Progress Error",
        description: "Failed to update your progress. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [userLearningData, user?.id, toast]);

  useEffect(() => {
    fetchUserLearningData();
  }, [fetchUserLearningData]);

  return {
    userLearningData,
    loading,
    error,
    updateModuleCompletion,
    refreshData: fetchUserLearningData
  };
};
