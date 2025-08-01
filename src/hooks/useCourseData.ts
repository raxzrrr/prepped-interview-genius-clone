import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { courseService, Course, CourseVideo } from '@/services/courseService';
import { questionService, CourseQuestion } from '@/services/questionService';
import { learningService, UserLearningData } from '@/services/learningService';

export const useCourseData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesWithVideos, setCoursesWithVideos] = useState<Course[]>([]);
  const [coursesWithQuestions, setCoursesWithQuestions] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Record<string, CourseVideo[]>>({});
  const [questions, setQuestions] = useState<Record<string, CourseQuestion[]>>({});
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
      
      // Fetch courses
      const coursesData = await courseService.fetchCourses();
      
      // Fetch videos and questions for each course
      const videosData: Record<string, CourseVideo[]> = {};
      const questionsData: Record<string, CourseQuestion[]> = {};
      
      for (const course of coursesData) {
        try {
          const [courseVideos, courseQuestions] = await Promise.all([
            courseService.fetchVideosByCourse(course.id),
            questionService.fetchQuestionsByCourse(course.id)
          ]);
          videosData[course.id] = courseVideos;
          questionsData[course.id] = courseQuestions;
        } catch (err) {
          console.error(`Error fetching data for course ${course.name}:`, err);
          videosData[course.id] = []; // Fallback to empty array
          questionsData[course.id] = []; // Fallback to empty array
        }
      }
      
      // Filter courses for different purposes
      const coursesWithVideos = coursesData.filter(course => 
        videosData[course.id] && videosData[course.id].length > 0
      );
      
      const coursesWithQuestions = coursesData.filter(course => 
        questionsData[course.id] && questionsData[course.id].length > 0
      );
      
      setCourses(coursesData); // All courses
      setCoursesWithVideos(coursesWithVideos); // Courses with videos (for courses tab)
      setCoursesWithQuestions(coursesWithQuestions); // Courses with questions (for assessment tab)
      setVideos(videosData);
      setQuestions(questionsData);
      
      // Fetch user learning data if user is logged in
      if (user?.id) {
        try {
          const totalVideos = Object.values(videosData).reduce((sum, vids) => sum + vids.length, 0);
          const learningData = await learningService.fetchUserLearningData(user.id, totalVideos);
          
          if (learningData) {
            setUserLearningData(learningData);
            saveLocalProgress(learningData.course_progress_new || {});
          } else {
            // Create fallback with local data
            const localProgress = getLocalProgress();
            const fallbackData: UserLearningData = {
              id: 'local-' + user.id,
              user_id: user.id,
              course_progress: {},
              course_progress_new: localProgress,
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
            course_progress_new: localProgress,
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

  const getCourseProgress = useCallback((courseId: string): number => {
    if (!userLearningData?.course_progress_new) return 0;
    
    const courseProgress = userLearningData.course_progress_new[courseId] || {};
    const courseVideos = videos[courseId] || [];
    
    if (courseVideos.length === 0) return 0;
    
    const completedCount = Object.values(courseProgress).filter(completed => completed === true).length;
    return Math.round((completedCount / courseVideos.length) * 100);
  }, [userLearningData, videos]);

  const getCourseVideoCount = useCallback((courseId: string): number => {
    return videos[courseId]?.length || 0;
  }, [videos]);

  const updateVideoCompletion = useCallback(async (videoId: string, courseId: string) => {
    if (!user?.id) return false;

    try {
      const currentProgress = userLearningData?.course_progress_new || getLocalProgress();
      const updatedProgress = { ...currentProgress };
      
      if (!updatedProgress[courseId]) {
        updatedProgress[courseId] = {};
      }
      
      updatedProgress[courseId][videoId] = true;
      
      // Update local state immediately
      setUserLearningData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          course_progress_new: updatedProgress,
          updated_at: new Date().toISOString()
        };
      });
      
      // Save to localStorage
      saveLocalProgress(updatedProgress);
      
      return true;
    } catch (err: any) {
      console.error('Error updating video completion:', err);
      return false;
    }
  }, [user?.id, userLearningData]);

  const removeVideoCompletion = useCallback(async (videoId: string, courseId: string) => {
    if (!user?.id) return false;

    try {
      const currentProgress = userLearningData?.course_progress_new || getLocalProgress();
      const updatedProgress = { ...currentProgress };
      
      if (updatedProgress[courseId] && updatedProgress[courseId][videoId]) {
        delete updatedProgress[courseId][videoId];
      }
      
      // Update local state immediately
      setUserLearningData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          course_progress_new: updatedProgress,
          updated_at: new Date().toISOString()
        };
      });
      
      // Save to localStorage
      saveLocalProgress(updatedProgress);
      
      return true;
    } catch (err: any) {
      console.error('Error removing video completion:', err);
      return false;
    }
  }, [user?.id, userLearningData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    courses: coursesWithVideos, // Default to courses with videos for backward compatibility
    coursesWithVideos, // Explicitly available for courses tab
    coursesWithQuestions, // Explicitly available for assessment tab
    allCourses: courses, // All courses if needed
    videos,
    questions,
    userLearningData,
    loading,
    error,
    getCourseProgress,
    getCourseVideoCount,
    updateVideoCompletion,
    removeVideoCompletion,
    refreshData: fetchData
  };
};
