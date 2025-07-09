import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { courseService, Course, CourseVideo } from '@/services/courseService';

export const useCourseManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Record<string, CourseVideo[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingVideo, setEditingVideo] = useState<CourseVideo | null>(null);

  // Check admin access
  const hasAdminAccess = user?.publicMetadata?.role === 'admin' || user?.emailAddresses?.[0]?.emailAddress === 'admin@interview.ai';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.fetchCourses();
      setCourses(coursesData);

      const videosData: Record<string, CourseVideo[]> = {};
      for (const course of coursesData) {
        const courseVideos = await courseService.fetchVideosByCourse(course.id);
        videosData[course.id] = courseVideos;
      }
      setVideos(videosData);
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

  const handleAddCourse = useCallback(async (course: Course) => {
    try {
      const newCourse = await courseService.addCourse(course);
      setCourses(prevCourses => [...prevCourses, newCourse]);
      setShowAddCourse(false);
      toast({
        title: "Course Added",
        description: "New course has been successfully added.",
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
      const updatedCourse = await courseService.updateCourse(course);
      setCourses(prevCourses =>
        prevCourses.map(c => (c.id === course.id ? updatedCourse : c))
      );
      setEditingCourse(null);
      toast({
        title: "Course Updated",
        description: "Course has been successfully updated.",
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

  const handleAddVideo = useCallback(async (video: CourseVideo) => {
    if (!selectedCourse) return;
    try {
      const newVideo = await courseService.addVideo(video);
      setVideos(prevVideos => ({
        ...prevVideos,
        [selectedCourse.id]: [...(prevVideos[selectedCourse.id] || []), newVideo]
      }));
      setShowAddVideo(false);
      toast({
        title: "Video Added",
        description: "New video has been successfully added.",
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
      const updatedVideo = await courseService.updateVideo(video);
      setVideos(prevVideos => {
        const updatedVideos = { ...prevVideos };
        if (updatedVideos[video.course_id]) {
          updatedVideos[video.course_id] = updatedVideos[video.course_id].map(v =>
            v.id === video.id ? updatedVideo : v
          );
        }
        return updatedVideos;
      });
      setEditingVideo(null);
      toast({
        title: "Video Updated",
        description: "Video has been successfully updated.",
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
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      setVideos(prevVideos => {
        const updatedVideos = { ...prevVideos };
        delete updatedVideos[courseId];
        return updatedVideos;
      });
      toast({
        title: "Course Deleted",
        description: "Course has been successfully deleted.",
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
      console.log('Deleting video:', videoId, 'from course:', courseId);
      
      await courseService.deleteVideo(videoId);
      
      // Update local state by removing the video from the videos array
      setVideos(prevVideos => {
        const updatedVideos = { ...prevVideos };
        if (updatedVideos[courseId]) {
          updatedVideos[courseId] = updatedVideos[courseId].filter(video => video.id !== videoId);
        }
        return updatedVideos;
      });
      
      toast({
        title: "Video Deleted",
        description: "Video has been successfully deleted from the database and storage.",
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    // State
    courses,
    videos,
    loading,
    selectedCourse,
    showAddCourse,
    showAddVideo,
    editingCourse,
    editingVideo,
    hasAdminAccess,
    user,
    
    // State setters
    setSelectedCourse,
    setShowAddCourse,
    setShowAddVideo,
    setEditingCourse,
    setEditingVideo,
    
    // Handlers
    handleAddCourse,
    handleUpdateCourse,
    handleAddVideo,
    handleUpdateVideo,
    handleDeleteCourse,
    handleDeleteVideo
  };
};
