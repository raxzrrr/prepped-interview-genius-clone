import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Video, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { courseService, Course, CourseVideo } from '@/services/courseService';
import { supabase } from '@/integrations/supabase/client';

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
  
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    order_index: 0
  });
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    order_index: 0
  });

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

  const handleAddCourse = async () => {
    if (!newCourse.name || !newCourse.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const course = await courseService.addCourse({
        ...newCourse,
        is_active: true
      });
      
      setCourses([...courses, course]);
      setVideos({ ...videos, [course.id]: [] });
      setNewCourse({ name: '', description: '', order_index: 0 });
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

  const handleAddVideo = async () => {
    if (!selectedCourse || !newVideo.title || !newVideo.video_url) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const video = await courseService.addVideo({
        ...newVideo,
        course_id: selectedCourse.id,
        is_active: true
      });
      
      setVideos({
        ...videos,
        [selectedCourse.id]: [...(videos[selectedCourse.id] || []), video]
      });
      
      setNewVideo({ title: '', description: '', video_url: '', duration: '', order_index: 0 });
      setShowAddVideo(false);
      
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
              Create and manage educational courses and video content (Real-time updates enabled)
            </p>
          </div>
          <Button onClick={() => setShowAddCourse(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        {showAddCourse && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Course</CardTitle>
              <CardDescription>Create a new course for students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  placeholder="Enter course description"
                />
              </div>
              <div>
                <Label htmlFor="order">Order Index</Label>
                <Input
                  id="order"
                  type="number"
                  value={newCourse.order_index}
                  onChange={(e) => setNewCourse({...newCourse, order_index: parseInt(e.target.value) || 0})}
                  placeholder="Enter order index"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddCourse}>Create Course</Button>
                <Button variant="outline" onClick={() => {
                  setShowAddCourse(false);
                  setNewCourse({ name: '', description: '', order_index: 0 });
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAddVideo && selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Video to "{selectedCourse.name}"</CardTitle>
              <CardDescription>Add educational video content to this course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="videoTitle">Video Title *</Label>
                <Input
                  id="videoTitle"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                  placeholder="Enter video title"
                />
              </div>
              <div>
                <Label htmlFor="videoDescription">Video Description</Label>
                <Textarea
                  id="videoDescription"
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                  placeholder="Enter video description (optional)"
                />
              </div>
              <div>
                <Label htmlFor="videoUrl">Video URL *</Label>
                <Input
                  id="videoUrl"
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
                  placeholder="Enter YouTube URL or embed link"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={newVideo.duration}
                  onChange={(e) => setNewVideo({...newVideo, duration: e.target.value})}
                  placeholder="e.g., 15:30 or 1h 20m"
                />
              </div>
              <div>
                <Label htmlFor="videoOrder">Order Index</Label>
                <Input
                  id="videoOrder"
                  type="number"
                  value={newVideo.order_index}
                  onChange={(e) => setNewVideo({...newVideo, order_index: parseInt(e.target.value) || 0})}
                  placeholder="Enter order index"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddVideo}>Add Video</Button>
                <Button variant="outline" onClick={() => {
                  setShowAddVideo(false);
                  setSelectedCourse(null);
                  setNewVideo({ title: '', description: '', video_url: '', duration: '', order_index: 0 });
                }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="border-2 hover:border-brand-purple/20 transition-colors">
              <CardHeader>
                {editingCourse?.id === course.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editingCourse.name}
                      onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
                      className="font-semibold"
                      placeholder="Course name"
                    />
                    <Textarea
                      value={editingCourse.description || ''}
                      onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                      className="text-sm"
                      placeholder="Course description"
                    />
                    <Input
                      type="number"
                      value={editingCourse.order_index}
                      onChange={(e) => setEditingCourse({...editingCourse, order_index: parseInt(e.target.value) || 0})}
                      placeholder="Order index"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleUpdateCourse(editingCourse)}>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingCourse(null)}>
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-lg text-brand-purple">{course.name}</CardTitle>
                    <CardDescription className="text-sm">{course.description}</CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span className="flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      <Video className="w-3 h-3 mr-1" />
                      {videos[course.id]?.length || 0} videos
                    </span>
                    <span className="text-xs text-gray-500">Order: {course.order_index}</span>
                  </div>
                </div>
                
                {videos[course.id]?.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Recent Videos:</h4>
                    {videos[course.id].slice(0, 2).map((video) => (
                      <div key={video.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded border">
                        {editingVideo?.id === video.id ? (
                          <div className="flex-1 space-y-1">
                            <Input
                              value={editingVideo.title}
                              onChange={(e) => setEditingVideo({...editingVideo, title: e.target.value})}
                              className="text-xs h-6"
                            />
                            <Input
                              value={editingVideo.video_url}
                              onChange={(e) => setEditingVideo({...editingVideo, video_url: e.target.value})}
                              className="text-xs h-6"
                              placeholder="Video URL"
                            />
                            <div className="flex space-x-1 mt-1">
                              <Button size="sm" onClick={() => handleUpdateVideo(editingVideo)} className="h-6 px-2">
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingVideo(null)} className="h-6 px-2">
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <span className="font-medium">{video.title}</span>
                              {video.duration && <span className="text-gray-500 ml-2">({video.duration})</span>}
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingVideo(video)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteVideo(video.id, course.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {videos[course.id].length > 2 && (
                      <p className="text-xs text-gray-500 pl-2">+ {videos[course.id].length - 2} more videos</p>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowAddVideo(true);
                    }}
                    className="bg-brand-purple hover:bg-brand-purple/90"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Video
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingCourse(course)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit Course
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
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
