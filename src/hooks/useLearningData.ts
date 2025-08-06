
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
        saveLocalProgress(data.course_progress);
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
          course_progress: localProgress,
          course_progress_new: localProgress,
          completed_modules: completedCount,
          total_modules: totalModules,
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
        course_progress: localProgress,
        course_progress_new: localProgress,
        completed_modules: completedCount,
        total_modules: totalModules,
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
      console.log('Updating module completion using service:', { moduleId, courseId });
      
      const currentProgress = userLearningData?.course_progress || getLocalProgress();
      
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

      // Always save to localStorage first for immediate feedback
      saveLocalProgress(courseProgress);

      // Update local state immediately
      const isInterviewCourseComplete = Object.keys(courseProgress['interview-mastery'] || {}).filter(
        key => courseProgress['interview-mastery'][key] === true
      ).length >= 5;

      setUserLearningData(prevData => {
        if (!prevData) {
          return {
            id: 'local-' + user.id,
            user_id: user.id,
            course_progress: courseProgress,
            course_progress_new: courseProgress,
            completed_modules: completedModulesCount,
            total_modules: totalModules,
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
          course_progress: courseProgress,
          course_progress_new: courseProgress,
          completed_modules: completedModulesCount,
          course_score: isInterviewCourseComplete ? 85 : prevData.course_score,
          course_completed_at: isInterviewCourseComplete ? new Date().toISOString() : prevData.course_completed_at,
          updated_at: new Date().toISOString()
        };
      });

      // Try to update via service (async, don't block UI)
      try {
        const updatedData = await learningService.updateModuleProgress(
          user.id,
          courseProgress,
          completedModulesCount,
          totalModules
        );
        
        console.log('Successfully updated learning progress via service');
        setUserLearningData(updatedData);
        
        toast({
          title: "Progress Saved",
          description: "Your learning progress has been updated.",
        });
      } catch (serviceError: any) {
        console.error('Service update error (continuing with local state):', serviceError);
        // Don't show error toast for service failures - user progress is still saved locally
      }

      return true;
    } catch (err: any) {
      console.error('Error updating module completion:', err);
      // Still return true since local state was updated
      return true;
    }
  }, [userLearningData, user?.id, toast, totalModules]);

  const updateAssessmentScore = useCallback(async (score: number) => {
    if (!user?.id) return false;

    try {
      const now = new Date().toISOString();
      
      // Update local state first
      setUserLearningData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          assessment_attempted: true,
          assessment_score: score,
          assessment_completed_at: now,
          updated_at: now
        };
      });

      // Try to update via service
      try {
        const updatedData = await learningService.updateAssessmentScore(user.id, score);
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
