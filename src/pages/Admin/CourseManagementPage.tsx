
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Video, FileText, Edit, Trash2 } from 'lucide-react';

const CourseManagementPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "Introduction to Programming",
      description: "Learn the basics of programming with hands-on exercises",
      videos: 5,
      assessments: 2
    },
    {
      id: 2,
      title: "Advanced JavaScript",
      description: "Deep dive into JavaScript concepts and frameworks",
      videos: 8,
      assessments: 3
    }
  ]);
  
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: ''
  });

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';
  
  if (!user && !isTempAdmin) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin() && !isTempAdmin) {
    return <Navigate to="/dashboard" />;
  }

  const handleAddCourse = () => {
    if (newCourse.title && newCourse.description) {
      const course = {
        id: Date.now(),
        title: newCourse.title,
        description: newCourse.description,
        videos: 0,
        assessments: 0
      };
      setCourses([...courses, course]);
      setNewCourse({ title: '', description: '' });
      setShowAddCourse(false);
      toast({
        title: "Course Added",
        description: "New course has been successfully created",
      });
    }
  };

  const handleDeleteCourse = (id: number) => {
    setCourses(courses.filter(course => course.id !== id));
    toast({
      title: "Course Deleted",
      description: "Course has been successfully removed",
    });
  };

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
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  placeholder="Enter course title"
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
              <div className="flex space-x-2">
                <Button onClick={handleAddCourse}>Create Course</Button>
                <Button variant="outline" onClick={() => setShowAddCourse(false)}>
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
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      {course.videos} videos
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {course.assessments} assessments
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
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
