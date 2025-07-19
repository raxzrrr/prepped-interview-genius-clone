import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { courseService, Course, CourseVideo } from '@/services/courseService';
import { questionService, CourseQuestion } from '@/services/questionService';

export const useCourseManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Record<string, CourseVideo[]>>({});
  const [questions, setQuestions] = useState<Record<string, CourseQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingVideo, setEditingVideo] = useState<CourseVideo | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<CourseQuestion | null>(null);

  // Check admin access - including temporary admin
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';
  const hasAdminAccess = isTempAdmin || 
    user?.publicMetadata?.role === 'admin' || 
    user?.emailAddresses?.[0]?.emailAddress === 'admin@interview.ai';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.fetchCourses();
      setCourses(coursesData);

      const videosData: Record<string, CourseVideo[]> = {};
      const questionsData: Record<string, CourseQuestion[]> = {};
      
      for (const course of coursesData) {
        const [courseVideos, courseQuestions] = await Promise.all([
          courseService.fetchVideosByCourse(course.id),
          questionService.fetchQuestionsByCourse(course.id)
        ]);
        videosData[course.id] = courseVideos;
        questionsData[course.id] = courseQuestions;
      }
      
      setVideos(videosData);
      setQuestions(questionsData);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch courses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleAddCourse = useCallback(async (courseData: { name: string; description: string; order_index: number }) => {
    try {
      const newCourse = await courseService.addCourse({ ...courseData, is_active: true });
      setCourses(prev => [...prev, newCourse]);
      setVideos(prev => ({ ...prev, [newCourse.id]: [] }));
      setQuestions(prev => ({ ...prev, [newCourse.id]: [] }));
      setShowAddCourse(false);
      
      toast({
        title: "Success",
        description: "Course added successfully",
      });
    } catch (error: any) {
      console.error('Error adding course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add course. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleUpdateCourse = useCallback(async (course: Course) => {
    try {
      const updatedCourse = await courseService.updateCourse(course.id, course);
      setCourses(prev => prev.map(c => c.id === course.id ? updatedCourse : c));
      setEditingCourse(null);
      
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update course. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleAddVideo = useCallback(async (videoData: { 
    title: string; 
    description: string; 
    video_url: string; 
    duration: string; 
    order_index: number; 
    content_type: string; 
    file_path?: string; 
    file_size?: number; 
    thumbnail_url?: string; 
  }) => {
    if (!selectedCourse) return;

    try {
      const newVideo = await courseService.addVideo({
        course_id: selectedCourse.id,
        is_active: true,
        ...videoData
      });

      setVideos(prev => ({
        ...prev,
        [selectedCourse.id]: [...(prev[selectedCourse.id] || []), newVideo]
      }));

      setShowAddVideo(false);
      toast({
        title: "Success",
        description: "Video added successfully",
      });
    } catch (error: any) {
      console.error('Error adding video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add video. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedCourse, toast]);

  const handleUpdateVideo = useCallback(async (video: CourseVideo) => {
    try {
      const updatedVideo = await courseService.updateVideo(video.id, video);
      
      setVideos(prev => ({
        ...prev,
        [video.course_id]: prev[video.course_id]?.map(v => 
          v.id === video.id ? updatedVideo : v
        ) || []
      }));
      
      setEditingVideo(null);
      toast({
        title: "Success",
        description: "Video updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update video. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteCourse = useCallback(async (courseId: string) => {
    try {
      await courseService.deleteCourse(courseId);
      setCourses(prev => prev.filter(course => course.id !== courseId));
      setVideos(prev => {
        const newVideos = { ...prev };
        delete newVideos[courseId];
        return newVideos;
      });
      setQuestions(prev => {
        const newQuestions = { ...prev };
        delete newQuestions[courseId];
        return newQuestions;
      });
      
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete course. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteVideo = useCallback(async (videoId: string, courseId: string) => {
    try {
      await courseService.deleteVideo(videoId);
      
      setVideos(prev => ({
        ...prev,
        [courseId]: prev[courseId]?.filter(video => video.id !== videoId) || []
      }));
      
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete video. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleAddQuestion = useCallback(async (questionData: {
    question_text: string;
    difficulty_level: 'easy' | 'intermediate' | 'hard';
    option_1: string;
    option_2: string;
    option_3: string;
    option_4: string;
    correct_answer: number;
    explanation?: string;
    order_index: number;
  }) => {
    if (!selectedCourse) return;

    try {
      const newQuestion = await questionService.addQuestion({
        course_id: selectedCourse.id,
        ...questionData
      });

      setQuestions(prev => ({
        ...prev,
        [selectedCourse.id]: [...(prev[selectedCourse.id] || []), newQuestion]
      }));

      setShowAddQuestion(false);
      toast({
        title: "Success",
        description: "Question added successfully",
      });
    } catch (error: any) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add question. Please try again.",
        variant: "destructive"
      });
    }
  }, [selectedCourse, toast]);

  const handleUpdateQuestion = useCallback(async (question: CourseQuestion) => {
    try {
      const updatedQuestion = await questionService.updateQuestion(question.id, question);
      
      setQuestions(prev => ({
        ...prev,
        [question.course_id]: prev[question.course_id]?.map(q => 
          q.id === question.id ? updatedQuestion : q
        ) || []
      }));
      
      setEditingQuestion(null);
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update question. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteQuestion = useCallback(async (questionId: string, courseId: string) => {
    try {
      await questionService.deleteQuestion(questionId);
      
      setQuestions(prev => ({
        ...prev,
        [courseId]: prev[courseId]?.filter(question => question.id !== questionId) || []
      }));
      
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete question. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (hasAdminAccess && !authLoading) {
      fetchData();
    }
  }, [hasAdminAccess, authLoading, fetchData]);

  return {
    // State
    courses,
    videos,
    questions,
    loading,
    selectedCourse,
    showAddCourse,
    showAddVideo,
    showAddQuestion,
    editingCourse,
    editingVideo,
    editingQuestion,
    hasAdminAccess,
    user,
    authLoading,
    
    // State setters
    setSelectedCourse,
    setShowAddCourse,
    setShowAddVideo,
    setShowAddQuestion,
    setEditingCourse,
    setEditingVideo,
    setEditingQuestion,
    
    // Handlers
    handleAddCourse,
    handleUpdateCourse,
    handleAddVideo,
    handleUpdateVideo,
    handleDeleteCourse,
    handleDeleteVideo,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion
  };
};