
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { courseService, CourseCategory, CourseVideo } from '@/services/courseService';
import { learningService, UserLearningData } from '@/services/learningService';

export const useCourseData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [videos, setVideos] = useState<Record<string, CourseVideo[]>>({});
  const [userLearningData, setUserLearningData] = useState<UserLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getLocalProgressKey = () => `course_progress_${user?.id}`;
  
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

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching course data...');
      
      // Fetch categories
      const categoriesData = await courseService.fetchCategories();
      setCategories(categoriesData);
      
      // Fetch videos for each category
      const videosData: Record<string, CourseVideo[]> = {};
      for (const category of categoriesData) {
        try {
          const categoryVideos = await courseService.fetchVideosByCategory(category.id);
          videosData[category.id] = categoryVideos;
        } catch (err) {
          console.error(`Error fetching videos for category ${category.name}:`, err);
          videosData[category.id] = []; // Fallback to empty array
        }
      }
      setVideos(videosData);
      
      // Fetch user learning data if user is logged in
      if (user?.id) {
        try {
          const totalVideos = Object.values(videosData).reduce((sum, vids) => sum + vids.length, 0);
          const learningData = await learningService.fetchUserLearningData(user.id, totalVideos);
          
          if (learningData) {
            setUserLearningData(learningData);
            saveLocalProgress(learningData.category_progress || {});
          } else {
            // Create fallback with local data
            const localProgress = getLocalProgress();
            const fallbackData: UserLearningData = {
              id: 'local-' + user.id,
              user_id: user.id,
              course_progress: {}, // Legacy field
              category_progress: localProgress,
              completed_modules: 0,
              total_modules: totalVideos,
              course_score: null,
              course_completed_at: null,
              assessment_attempted: false,
              assessment_score: null,
              assessment_completed_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setUserLearningData(fallbackData);
          }
        } catch (learningErr: any) {
          console.error('Error fetching learning data:', learningErr);
          // Continue with local fallback
          const localProgress = getLocalProgress();
          const totalVideos = Object.values(videosData).reduce((sum, vids) => sum + vids.length, 0);
          const fallbackData: UserLearningData = {
            id: 'local-' + user.id,
            user_id: user.id,
            course_progress: {},
            category_progress: localProgress,
            completed_modules: 0,
            total_modules: totalVideos,
            course_score: null,
            course_completed_at: null,
            assessment_attempted: false,
            assessment_score: null,
            assessment_completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setUserLearningData(fallbackData);
        }
      }
      
    } catch (err: any) {
      console.error('Error fetching course data:', err);
      setError(err.message);
      toast({
        title: "Error Loading Courses",
        description: "Failed to load course data. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const getCategoryProgress = useCallback((categoryId: string): number => {
    if (!userLearningData?.category_progress) return 0;
    
    const categoryProgress = userLearningData.category_progress[categoryId] || {};
    const categoryVideos = videos[categoryId] || [];
    
    if (categoryVideos.length === 0) return 0;
    
    const completedCount = Object.values(categoryProgress).filter(completed => completed === true).length;
    return Math.round((completedCount / categoryVideos.length) * 100);
  }, [userLearningData, videos]);

  const getCategoryVideoCount = useCallback((categoryId: string): number => {
    return videos[categoryId]?.length || 0;
  }, [videos]);

  const updateVideoCompletion = useCallback(async (videoId: string, categoryId: string) => {
    if (!user?.id) return false;

    try {
      const currentProgress = userLearningData?.category_progress || getLocalProgress();
      const updatedProgress = { ...currentProgress };
      
      if (!updatedProgress[categoryId]) {
        updatedProgress[categoryId] = {};
      }
      
      updatedProgress[categoryId][videoId] = true;
      
      // Update local state immediately
      setUserLearningData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          category_progress: updatedProgress,
          updated_at: new Date().toISOString()
        };
      });
      
      // Save to localStorage
      saveLocalProgress(updatedProgress);
      
      toast({
        title: "Progress Saved",
        description: "Video marked as completed!",
      });
      
      return true;
    } catch (err: any) {
      console.error('Error updating video completion:', err);
      return false;
    }
  }, [user?.id, userLearningData, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    categories,
    videos,
    userLearningData,
    loading,
    error,
    getCategoryProgress,
    getCategoryVideoCount,
    updateVideoCompletion,
    refreshData: fetchData
  };
};
