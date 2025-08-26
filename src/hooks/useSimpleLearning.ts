import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/hooks/use-toast';
import { courseService, Course, CourseVideo } from '@/services/courseService';
import { questionService } from '@/services/questionService';
import { learningService } from '@/services/learningService';

interface CourseProgress {
  [videoId: string]: boolean;
}

interface SimpleLearningData {
  courses: Course[];
  videos: Record<string, CourseVideo[]>;
  progress: Record<string, CourseProgress>;
  loading: boolean;
  error: string | null;
}

export const useSimpleLearning = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<SimpleLearningData>({
    courses: [],
    videos: {},
    progress: {},
    loading: true,
    error: null
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch courses and videos in parallel
        const courses = await courseService.fetchCourses();
        
        // Fetch all videos in parallel using Promise.all
        const videoPromises = courses.map(async (course) => ({
          course,
          videos: await courseService.fetchVideosByCourse(course.id)
        }));
        
        const coursesWithVideosData = await Promise.all(videoPromises);
        
        const coursesWithVideos = [];
        const videosMap: Record<string, CourseVideo[]> = {};
        
        for (const { course, videos } of coursesWithVideosData) {
          if (videos.length > 0) {
            coursesWithVideos.push(course);
            videosMap[course.id] = videos;
          }
        }

        // Load and merge progress from both server and localStorage
        const progressMap: Record<string, CourseProgress> = {};
        
        // First load from localStorage for immediate UI
        const savedProgress = localStorage.getItem(`learning_progress_${user?.id}`);
        const localProgress = savedProgress ? JSON.parse(savedProgress) : {};
        
        // Then load from server and merge
        for (const course of coursesWithVideos) {
          try {
            const serverData = await learningService.fetchUserLearningData(
              user!.id,
              videosMap[course.id].length,
              course.id
            );
            
            if (serverData?.progress) {
              // Server data takes precedence, merge with local if needed
              progressMap[course.id] = { ...localProgress[course.id], ...serverData.progress };
            } else {
              // Use local data if no server data
              progressMap[course.id] = localProgress[course.id] || {};
            }
          } catch (error) {
            console.warn(`Failed to load server progress for course ${course.id}:`, error);
            // Fallback to local progress
            progressMap[course.id] = localProgress[course.id] || {};
          }
        }

        setData({
          courses: coursesWithVideos,
          videos: videosMap,
          progress: progressMap,
          loading: false,
          error: null
        });
      } catch (error: any) {
        console.error('Error loading learning data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to load courses'
        }));
        toast({
          title: 'Error',
          description: 'Failed to load courses. Please try again.',
          variant: 'destructive'
        });
      }
    };

    if (user) {
      loadData();
    }
  }, [user, toast]);

  // Save progress to localStorage
  const saveProgress = (newProgress: Record<string, CourseProgress>) => {
    try {
      localStorage.setItem(`learning_progress_${user?.id}`, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Debounced save to server
  const saveProgressToServer = useCallback(
    async (courseId: string, courseProgress: CourseProgress) => {
      if (!user) return;
      
      try {
        const videos = data.videos[courseId] || [];
        const completedCount = videos.filter(video => courseProgress[video.id]).length;
        const isCompleted = completedCount === videos.length;
        
        await learningService.updateModuleProgress(
          user.id,
          courseId,
          courseProgress,
          completedCount,
          videos.length
        );
        
        // Show completion toast if course is now 100% complete
        if (isCompleted && completedCount > 0) {
          toast({
            title: 'Course Completed!',
            description: 'You can now take the assessment to earn your certificate.',
          });
        }
      } catch (error) {
        console.error('Failed to save progress to server:', error);
        // Don't show error toast for server saves to avoid annoying user
      }
    },
    [user, data.videos, toast]
  );

  // Toggle video completion
  const toggleVideoCompletion = useCallback((courseId: string, videoId: string) => {
    const newProgress = { ...data.progress };
    
    if (!newProgress[courseId]) {
      newProgress[courseId] = {};
    }
    
    newProgress[courseId][videoId] = !newProgress[courseId][videoId];
    
    // Update UI immediately
    setData(prev => ({ ...prev, progress: newProgress }));
    
    // Save to localStorage immediately
    saveProgress(newProgress);
    
    // Save to server with debouncing (fire and forget)
    setTimeout(() => {
      saveProgressToServer(courseId, newProgress[courseId]);
    }, 500);
    
    const isComplete = newProgress[courseId][videoId];
    toast({
      title: isComplete ? 'Video Completed' : 'Video Marked Incomplete',
      description: isComplete ? 'Progress saved!' : 'Video unmarked as complete'
    });
  }, [data.progress, saveProgress, saveProgressToServer, toast]);

  // Get course progress percentage
  const getCourseProgress = (courseId: string): number => {
    const courseVideos = data.videos[courseId] || [];
    if (courseVideos.length === 0) return 0;
    
    const courseProgress = data.progress[courseId] || {};
    const completedCount = courseVideos.filter(video => courseProgress[video.id]).length;
    
    return Math.round((completedCount / courseVideos.length) * 100);
  };

  // Check if course is completed
  const isCourseCompleted = (courseId: string): boolean => {
    return getCourseProgress(courseId) === 100;
  };

  // Check if video is completed
  const isVideoCompleted = (courseId: string, videoId: string): boolean => {
    return data.progress[courseId]?.[videoId] || false;
  };

  // Check if course has questions for assessment
  const courseHasQuestions = async (courseId: string): Promise<boolean> => {
    try {
      const questions = await questionService.fetchQuestionsByCourse(courseId);
      return questions.length > 0;
    } catch (error) {
      console.error('Error checking course questions:', error);
      return false;
    }
  };

  return {
    ...data,
    toggleVideoCompletion,
    getCourseProgress,
    isCourseCompleted,
    isVideoCompleted,
    courseHasQuestions
  };
};