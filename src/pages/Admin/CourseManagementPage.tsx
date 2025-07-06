
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
              Create and manage educational courses and content
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
                <Label htmlFor="name">Course Name</Label>
                <Input
                  id="name"
                  value={newCourse.name}
                  onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <Label htmlFor="description">Course Description</Label>
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
                <Button variant="outline" onClick={() => setShowAddCourse(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAddVideo && selectedCourse && (
          <Card>
            <CardHeader>
              <CardTitle>Add New Video to {selectedCourse.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="videoTitle">Video Title</Label>
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
                  placeholder="Enter video description"
                />
              </div>
              <div>
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
                  placeholder="Enter video URL (YouTube, etc.)"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={newVideo.duration}
                  onChange={(e) => setNewVideo({...newVideo, duration: e.target.value})}
                  placeholder="e.g., 15:30"
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
                <Button variant="outline" onClick={() => setShowAddVideo(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                {editingCourse?.id === course.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editingCourse.name}
                      onChange={(e) => setEditingCourse({...editingCourse, name: e.target.value})}
                      className="font-semibold"
                    />
                    <Textarea
                      value={editingCourse.description || ''}
                      onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      value={editingCourse.order_index}
                      onChange={(e) => setEditingCourse({...editingCourse, order_index: parseInt(e.target.value) || 0})}
                      placeholder="Order"
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
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      {videos[course.id]?.length || 0} videos
                    </span>
                  </div>
                </div>
                
                {videos[course.id]?.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <h4 className="font-medium text-sm">Videos:</h4>
                    {videos[course.id].slice(0, 3).map((video) => (
                      <div key={video.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                        {editingVideo?.id === video.id ? (
                          <div className="flex-1 space-y-2">
                            <Input
                              value={editingVideo.title}
                              onChange={(e) => setEditingVideo({...editingVideo, title: e.target.value})}
                              className="text-xs"
                            />
                            <div className="flex space-x-1">
                              <Button size="sm" onClick={() => handleUpdateVideo(editingVideo)}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingVideo(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span>{video.title}</span>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingVideo(video)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteVideo(video.id, course.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {videos[course.id].length > 3 && (
                      <p className="text-xs text-gray-500">... and {videos[course.id].length - 3} more</p>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowAddVideo(true);
                    }}
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
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseManagementPage;
