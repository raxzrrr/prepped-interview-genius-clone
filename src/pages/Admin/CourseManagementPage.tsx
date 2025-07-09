import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Video, Loader2 } from 'lucide-react';
import { courseService, Course, CourseVideo } from '@/services/courseService';
import { supabase } from '@/integrations/supabase/client';
import { deleteVideoFile } from '@/utils/fileUpload';
import AddCourseForm from '@/components/Admin/AddCourseForm';
import AddVideoForm from '@/components/Admin/AddVideoForm';
import CourseCard from '@/components/Admin/CourseCard';

const CourseManagementPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [videos, setVideos] = useState<Record<string, CourseVideo[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingVideo, setEditingVideo] = useState<CourseVideo | null>(null);

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';
  
  if (!user && !isTempAdmin) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin() && !isTempAdmin) {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    fetchCourses();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.fetchCourses();
      setCourses(coursesData);
      
      // Fetch videos for each course
      const videosData: Record<string, CourseVideo[]> = {};
      for (const course of coursesData) {
        const courseVideos = await courseService.fetchVideosByCourse(course.id);
        videosData[course.id] = courseVideos;
      }
      setVideos(videosData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const courseChannel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses'
        },
        (payload) => {
          console.log('Course realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setCourses(prev => [...prev, payload.new as Course]);
            setVideos(prev => ({ ...prev, [payload.new.id]: [] }));
          } else if (payload.eventType === 'UPDATE') {
            setCourses(prev => prev.map(course => 
              course.id === payload.new.id ? payload.new as Course : course
            ));
          } else if (payload.eventType === 'DELETE') {
            setCourses(prev => prev.filter(course => course.id !== payload.old.id));
            setVideos(prev => {
              const newVideos = { ...prev };
              delete newVideos[payload.old.id];
              return newVideos;
            });
          }
        }
      )
      .subscribe();

    const videoChannel = supabase
      .channel('course-videos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_videos'
        },
        (payload) => {
          console.log('Video realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newVideo = payload.new as CourseVideo;
            setVideos(prev => ({
              ...prev,
              [newVideo.course_id]: [...(prev[newVideo.course_id] || []), newVideo]
            }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedVideo = payload.new as CourseVideo;
            setVideos(prev => ({
              ...prev,
              [updatedVideo.course_id]: prev[updatedVideo.course_id]?.map(video => 
                video.id === updatedVideo.id ? updatedVideo : video
              ) || []
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedVideo = payload.old as CourseVideo;
            setVideos(prev => ({
              ...prev,
              [deletedVideo.course_id]: prev[deletedVideo.course_id]?.filter(video => 
                video.id !== deletedVideo.id
              ) || []
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(courseChannel);
      supabase.removeChannel(videoChannel);
    };
  };

  const handleAddCourse = async (courseData: { name: string; description: string; order_index: number }) => {
    try {
      const course = await courseService.addCourse({
        ...courseData,
        is_active: true
      });
      
      setCourses([...courses, course]);
      setVideos({ ...videos, [course.id]: [] });
      setShowAddCourse(false);
      
      toast({
        title: "Success",
        description: "Course added successfully",
      });
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "Error",
        description: "Failed to add course",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCourse = async (course: Course) => {
    try {
      const updatedCourse = await courseService.updateCourse(course.id, {
        name: course.name,
        description: course.description,
        order_index: course.order_index
      });
      
      setCourses(courses.map(c => c.id === course.id ? updatedCourse : c));
      setEditingCourse(null);
      
      toast({
        title: "Success",
        description: "Course updated successfully",
      });
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive"
      });
    }
  };

  const handleAddVideo = async (videoData: { 
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
      const video = await courseService.addVideo({
        ...videoData,
        course_id: selectedCourse.id,
        is_active: true
      });
      
      setVideos({
        ...videos,
        [selectedCourse.id]: [...(videos[selectedCourse.id] || []), video]
      });
      
      setShowAddVideo(false);
      setSelectedCourse(null);
      
      toast({
        title: "Success",
        description: "Video added successfully",
      });
    } catch (error) {
      console.error('Error adding video:', error);
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive"
      });
    }
  };

  const handleUpdateVideo = async (video: CourseVideo) => {
    try {
      const updatedVideo = await courseService.updateVideo(video.id, {
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        duration: video.duration,
        order_index: video.order_index
      });
      
      setVideos({
        ...videos,
        [video.course_id]: videos[video.course_id].map(v => 
          v.id === video.id ? updatedVideo : v
        )
      });
      
      setEditingVideo(null);
      
      toast({
        title: "Success",
        description: "Video updated successfully",
      });
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      // Delete associated video files from storage
      const courseVideos = videos[courseId] || [];
      for (const video of courseVideos) {
        if (video.content_type === 'file' && video.file_path) {
          await deleteVideoFile(video.file_path);
        }
      }

      await courseService.deleteCourse(courseId);
      setCourses(courses.filter(course => course.id !== courseId));
      const newVideos = { ...videos };
      delete newVideos[courseId];
      setVideos(newVideos);
      
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVideo = async (videoId: string, courseId: string) => {
    try {
      // Find the video to get file path for deletion
      const video = videos[courseId]?.find(v => v.id === videoId);
      
      // Delete file from storage if it's an uploaded file
      if (video?.content_type === 'file' && video.file_path) {
        await deleteVideoFile(video.file_path);
      }

      await courseService.deleteVideo(videoId);
      setVideos({
        ...videos,
        [courseId]: videos[courseId].filter(video => video.id !== videoId)
      });
      
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading courses...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
            <p className="mt-2 text-gray-600">
              Create and manage educational courses and video content (Upload files or add links)
            </p>
          </div>
          <Button onClick={() => setShowAddCourse(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        {showAddCourse && (
          <AddCourseForm
            onAddCourse={handleAddCourse}
            onCancel={() => setShowAddCourse(false)}
          />
        )}

        {showAddVideo && selectedCourse && (
          <AddVideoForm
            selectedCourse={selectedCourse}
            onAddVideo={handleAddVideo}
            onCancel={() => {
              setShowAddVideo(false);
              setSelectedCourse(null);
            }}
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              videos={videos[course.id] || []}
              isEditing={editingCourse?.id === course.id}
              editingCourse={editingCourse}
              editingVideo={editingVideo}
              onEditCourse={setEditingCourse}
              onSaveCourse={handleUpdateCourse}
              onCancelEditCourse={() => setEditingCourse(null)}
              onEditVideo={setEditingVideo}
              onSaveVideo={handleUpdateVideo}
              onCancelEditVideo={() => setEditingVideo(null)}
              onDeleteCourse={handleDeleteCourse}
              onDeleteVideo={handleDeleteVideo}
              onAddVideo={(course) => {
                setSelectedCourse(course);
                setShowAddVideo(true);
              }}
              onEditingCourseChange={setEditingCourse}
              onEditingVideoChange={setEditingVideo}
            />
          ))}
        </div>

        {courses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Courses Yet</h3>
              <p className="text-gray-500 mb-4">Create your first course to get started with content management.</p>
              <Button onClick={() => setShowAddCourse(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Course
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CourseManagementPage;
