import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/hooks/use-toast';
import { courseService, Course, CourseVideo } from '@/services/courseService';
import { questionService } from '@/services/questionService';

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

        // Fetch courses
        const courses = await courseService.fetchCourses();
        const coursesWithVideos = [];
        const videosMap: Record<string, CourseVideo[]> = {};

        // Fetch videos for each course
        for (const course of courses) {
          const videos = await courseService.fetchVideosByCourse(course.id);
          if (videos.length > 0) {
            coursesWithVideos.push(course);
            videosMap[course.id] = videos;
          }
        }

        // Load progress from localStorage
        const savedProgress = localStorage.getItem(`learning_progress_${user?.id}`);
        const progress = savedProgress ? JSON.parse(savedProgress) : {};

        setData({
          courses: coursesWithVideos,
          videos: videosMap,
          progress,
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

  // Toggle video completion
  const toggleVideoCompletion = (courseId: string, videoId: string) => {
    const newProgress = { ...data.progress };
    
    if (!newProgress[courseId]) {
      newProgress[courseId] = {};
    }
    
    newProgress[courseId][videoId] = !newProgress[courseId][videoId];
    
    setData(prev => ({ ...prev, progress: newProgress }));
    saveProgress(newProgress);
    
    const isComplete = newProgress[courseId][videoId];
    toast({
      title: isComplete ? 'Video Completed' : 'Video Marked Incomplete',
      description: isComplete ? 'Great progress!' : 'Video unmarked as complete'
    });
  };

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