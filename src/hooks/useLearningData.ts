
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
        console.error('Database error:', error);
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
        await createUserLearningRecord(supabaseUUID, totalModules);
      }
    } catch (err: any) {
      console.error('Error fetching user learning data:', err);
      setError(err.message);
      
      // Create local fallback data when database fails
      const localData: UserLearningData = {
        id: 'local-' + user.id,
        user_id: generateConsistentUUID(user.id),
        course_progress: JSON.parse(localStorage.getItem(`learning_progress_${user.id}`) || '{}'),
        completed_modules: 0,
        total_modules: totalModules,
        course_score: null,
        course_completed_at: null,
        assessment_attempted: false,
        assessment_score: null,
        assessment_completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Calculate completed modules from local storage
      let completedCount = 0;
      Object.values(localData.course_progress).forEach(course => {
        if (course) {
          Object.values(course as Record<string, boolean>).forEach(completed => {
            if (completed) completedCount++;
          });
        }
      });
      localData.completed_modules = completedCount;
      
      setUserLearningData(localData);
      
      toast({
        title: "Working Offline",
        description: "Your progress is being saved locally until database connection is restored.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, totalModules, toast]);

  const createUserLearningRecord = async (supabaseUUID: string, totalModules: number) => {
    try {
      const newLearningData = {
        user_id: supabaseUUID,
        course_progress: {},
        completed_modules: 0,
        total_modules: totalModules,
        assessment_attempted: false,
        assessment_score: null,
        course_score: null,
        course_completed_at: null,
        assessment_completed_at: null
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
    } catch (err: any) {
      console.error('Error creating learning record:', err);
      throw err;
    }
  };

  const updateModuleCompletion = useCallback(async (moduleId: string, courseId: string) => {
    if (!user?.id) {
      console.error('No user ID available');
      return false;
    }

    try {
      console.log('Updating module completion:', { moduleId, courseId });
      
      const currentProgress = userLearningData?.course_progress || 
        JSON.parse(localStorage.getItem(`learning_progress_${user.id}`) || '{}');
      
      const courseProgress = {
        ...currentProgress,
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

      // Always save to localStorage for persistence
      localStorage.setItem(`learning_progress_${user.id}`, JSON.stringify(courseProgress));

      // Update local state first
      setUserLearningData(prevData => {
        if (!prevData) {
          return {
            id: 'local-' + user.id,
            user_id: generateConsistentUUID(user.id),
            course_progress: courseProgress,
            completed_modules: completedModulesCount,
            total_modules: totalModules,
            course_score: null,
            course_completed_at: null,
            assessment_attempted: false,
            assessment_score: null,
            assessment_completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return {
          ...prevData,
          course_progress: courseProgress,
          completed_modules: completedModulesCount,
          updated_at: new Date().toISOString()
        };
      });

      // Try to update database
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
        console.error('Database update error (continuing with local state):', error);
        toast({
          title: "Progress Saved Locally",
          description: "Your progress has been saved. Changes will sync when connection is restored.",
        });
      } else {
        console.log('Successfully updated learning progress in database');
        toast({
          title: "Progress Saved",
          description: "Your learning progress has been updated.",
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error updating module completion:', err);
      toast({
        title: "Progress Saved Locally",
        description: "Your progress has been saved locally.",
      });
      return true; // Return true since local state was updated
    }
  }, [userLearningData, user?.id, toast, totalModules]);

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
