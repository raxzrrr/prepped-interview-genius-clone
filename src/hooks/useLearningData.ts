
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/hooks/use-toast';
import { learningService, UserLearningData } from '@/services/learningService';

export const useLearningData = (totalModules: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userLearningData, setUserLearningData] = useState<UserLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getLocalProgressKey = () => `learning_progress_${user?.id}`;
  const getLocalProgress = () => {
    try {
      const stored = localStorage.getItem(getLocalProgressKey());
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const saveLocalProgress = (progress: Record<string, any>) => {
    try {
      localStorage.setItem(getLocalProgressKey(), JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save progress to localStorage:', error);
    }
  };

  const fetchUserLearningData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Fetching learning data using service for user:', user.id);
      
      const data = await learningService.fetchUserLearningData(user.id, totalModules);
      
      if (data) {
        console.log('Successfully fetched learning data:', data);
        setUserLearningData(data);
        
        // Sync local storage with server data
        saveLocalProgress(data.progress || data.course_progress || {});
      } else {
        // If no server data, use local fallback
        const localProgress = getLocalProgress();
        let completedCount = 0;
        Object.values(localProgress).forEach(course => {
          if (course) {
            Object.values(course as Record<string, boolean>).forEach(completed => {
              if (completed) completedCount++;
            });
          }
        });

        const localData: UserLearningData = {
          id: 'local-' + user.id,
          user_id: user.id,
          progress: localProgress,
          course_progress: localProgress,
          completed_modules_count: completedCount,
          total_modules_count: totalModules,
          course_score: null,
          course_completed_at: completedCount === totalModules ? new Date().toISOString() : null,
          assessment_attempted: false,
          assessment_score: null,
          assessment_completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setUserLearningData(localData);
      }
    } catch (err: any) {
      console.error('Error fetching user learning data:', err);
      setError(err.message);
      
      // Create local fallback data
      const localProgress = getLocalProgress();
      let completedCount = 0;
      Object.values(localProgress).forEach(course => {
        if (course) {
          Object.values(course as Record<string, boolean>).forEach(completed => {
            if (completed) completedCount++;
          });
        }
      });

      const localData: UserLearningData = {
        id: 'local-' + user.id,
        user_id: user.id,
        progress: localProgress,
        course_progress: localProgress,
        completed_modules_count: completedCount,
        total_modules_count: totalModules,
        course_score: null,
        course_completed_at: completedCount === totalModules ? new Date().toISOString() : null,
        assessment_attempted: false,
        assessment_score: null,
        assessment_completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUserLearningData(localData);
      
      toast({
        title: "Working Offline",
        description: "Progress is being saved locally and will sync when connection is restored.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, totalModules, toast]);

  const updateModuleCompletion = useCallback(async (moduleId: string, courseId: string) => {
    if (!user?.id) {
      console.error('No user ID available');
      return false;
    }

    try {
      console.log('Updating module completion for user:', user.id, 'module:', moduleId, 'course:', courseId);
      
      const currentProgress = userLearningData?.progress || userLearningData?.course_progress || getLocalProgress();
      
      const courseProgress = { ...currentProgress };
      
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

      // Update local state immediately for responsive UI
      const isInterviewCourseComplete = Object.keys(courseProgress['interview-mastery'] || {}).filter(
        key => courseProgress['interview-mastery'][key] === true
      ).length >= 5;

      setUserLearningData(prevData => {
        if (!prevData) {
          return {
            id: 'local-' + user.id,
            user_id: user.id,
            progress: courseProgress,
            course_progress: courseProgress,
            completed_modules_count: completedModulesCount,
            total_modules_count: totalModules,
            course_score: isInterviewCourseComplete ? 85 : null,
            course_completed_at: isInterviewCourseComplete ? new Date().toISOString() : null,
            assessment_attempted: false,
            assessment_score: null,
            assessment_completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return {
          ...prevData,
          progress: courseProgress,
          course_progress: courseProgress,
          completed_modules_count: completedModulesCount,
          course_score: isInterviewCourseComplete ? 85 : prevData.course_score,
          course_completed_at: isInterviewCourseComplete ? new Date().toISOString() : prevData.course_completed_at,
          updated_at: new Date().toISOString()
        };
      });

      // Save progress to Supabase (primary storage) - don't use localStorage as main storage
      try {
        const updatedData = await learningService.updateModuleProgress(
          user.id,
          courseId,
          courseProgress,
          completedModulesCount,
          totalModules
        );
        
        console.log('Successfully saved progress to Supabase');
        setUserLearningData(updatedData);
        
        // Only save to localStorage as backup after successful Supabase save
        saveLocalProgress(courseProgress);
        
        toast({
          title: "Progress Saved",
          description: "Your learning progress has been saved to your profile.",
        });
      } catch (serviceError: any) {
        console.error('Failed to save progress to Supabase:', serviceError);
        // Save to localStorage as fallback
        saveLocalProgress(courseProgress);
        
        toast({
          title: "Progress Saved Locally",
          description: "Progress saved offline. Will sync when connection is restored.",
          variant: "default"
        });
      }

      return true;
    } catch (err: any) {
      console.error('Error updating module completion:', err);
      return false;
    }
  }, [userLearningData, user?.id, toast, totalModules]);

  const updateAssessmentScore = useCallback(async (score: number) => {
    if (!user?.id) return false;

    try {
      const now = new Date().toISOString();
      const passed = score >= 70;
      
      // Update local state first
      setUserLearningData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          assessment_attempted: true,
          assessment_passed: passed,
          assessment_score: score,
          assessment_completed_at: passed ? now : null,
          updated_at: now
        };
      });

      // Try to update via direct database operation
      try {
        const updatedData = await learningService.updateAssessmentScore(user.id, 'interview-mastery', score);
        setUserLearningData(updatedData);
        console.log('Successfully updated assessment score via service');
        return true;
      } catch (serviceError) {
        console.error('Service update error for assessment (continuing with local state):', serviceError);
        return true; // Still return true since local state was updated
      }
    } catch (err: any) {
      console.error('Error updating assessment score:', err);
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserLearningData();
  }, [fetchUserLearningData]);

  return {
    userLearningData,
    loading,
    error,
    updateModuleCompletion,
    updateAssessmentScore,
    refreshData: fetchUserLearningData
  };
};
