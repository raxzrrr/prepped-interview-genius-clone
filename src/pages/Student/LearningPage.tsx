
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import CourseCard from '@/components/Learning/CourseCard';
import VideoPlayer from '@/components/Learning/VideoPlayer';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  enrolledCount: number;
  rating: number;
  category: string;
  isPremium: boolean;
  progress?: number;
  videoUrl?: string;
}

const LearningPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const { toast } = useToast();
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }
  
  const courses: Course[] = [
    {
      id: '1',
      title: 'Mastering Behavioral Interviews',
      description: 'Learn how to structure compelling stories for behavioral questions using the STAR method.',
      thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '3h 45m',
      enrolledCount: 5680,
      rating: 4.8,
      category: 'Behavioral',
      isPremium: true,
      videoUrl: 'https://www.youtube.com/embed/9onJ-l3Yw0k'
    },
    {
      id: '2',
      title: 'Technical Interview Fundamentals',
      description: 'Prepare for technical questions with practical exercises and expert tips.',
      thumbnail: 'https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '5h 20m',
      enrolledCount: 4230,
      rating: 4.7,
      category: 'Technical',
      isPremium: true,
      videoUrl: 'https://www.youtube.com/embed/kCDqQPxYTb4'
    },
    {
      id: '3',
      title: 'Body Language and Facial Expressions',
      description: 'Understand how your non-verbal cues affect interviewer perception and how to improve them.',
      thumbnail: 'https://images.unsplash.com/photo-1484863137850-59afcfe05386?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '2h 15m',
      enrolledCount: 3890,
      rating: 4.5,
      category: 'Presentation',
      isPremium: false,
      videoUrl: 'https://www.youtube.com/embed/PCWVi5pAa30'
    },
    {
      id: '4',
      title: 'Answering Salary Negotiations',
      description: 'Strategies for handling compensation discussions with confidence.',
      thumbnail: 'https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '1h 30m',
      enrolledCount: 2970,
      rating: 4.6,
      category: 'Negotiation',
      isPremium: true,
      videoUrl: 'https://www.youtube.com/embed/u9BoG1n1948'
    },
    {
      id: '5',
      title: 'Resume Building Workshop',
      description: 'Create a standout resume that will get you through the ATS and impress recruiters.',
      thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '4h 10m',
      enrolledCount: 6250,
      rating: 4.9,
      category: 'Preparation',
      isPremium: false,
      videoUrl: 'https://www.youtube.com/embed/TTBC7XlHSLg'
    },
    {
      id: '6',
      title: 'Handling Tough Interview Questions',
      description: 'Strategies for answering challenging questions that catch most candidates off guard.',
      thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '2h 50m',
      enrolledCount: 4120,
      rating: 4.7,
      category: 'Behavioral',
      isPremium: true,
      videoUrl: 'https://www.youtube.com/embed/ia-qEMJ-x-M'
    },
    {
      id: '7',
      title: 'Interview Anxiety Management',
      description: 'Techniques to control nerves and perform at your best during high-pressure interviews.',
      thumbnail: 'https://images.unsplash.com/photo-1489533119213-66a5cd877091?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '1h 45m',
      enrolledCount: 5380,
      rating: 4.8,
      category: 'Mindset',
      isPremium: false,
      videoUrl: 'https://player.vimeo.com/video/565082849'
    },
    {
      id: '8',
      title: 'Remote Interview Success',
      description: 'Master the unique challenges of virtual interviews and make a strong impression online.',
      thumbnail: 'https://images.unsplash.com/photo-1642176849879-92d33c2ba82e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      duration: '2h 30m',
      enrolledCount: 3790,
      rating: 4.6,
      category: 'Technical',
      isPremium: true,
      videoUrl: 'https://player.vimeo.com/video/589314408'
    }
  ];
  
  // Fetch user's course progress
  useEffect(() => {
    if (user) {
      fetchUserProgress();
    }
  }, [user]);
  
  const fetchUserProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('user_learning')
        .select('course_progress')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data?.course_progress) {
        setUserProgress(data.course_progress);
      }
    } catch (error) {
      console.error('Error fetching course progress:', error);
    }
  };
  
  const updateProgress = async (courseId: string, progress: number) => {
    try {
      const newProgress = { ...userProgress, [courseId]: progress };
      setUserProgress(newProgress);
      
      // Check if user exists in the table
      const { data, error } = await supabase
        .from('user_learning')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // Update existing record
        await supabase
          .from('user_learning')
          .update({ 
            course_progress: newProgress,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);
      } else {
        // Insert new record
        await supabase
          .from('user_learning')
          .insert({
            user_id: user?.id,
            course_progress: newProgress,
            total_modules: courses.length,
            completed_modules: Object.values(newProgress).filter(p => p >= 90).length
          });
      }
      
      // If course completed (progress >= 90%), show notification
      if (progress >= 90) {
        toast({
          title: "Course Completed!",
          description: "Congratulations! You've completed this course. Check your certificates page.",
        });
        
        // Update course completion in database
        await supabase
          .from('user_learning')
          .update({ 
            course_completed_at: new Date().toISOString(),
            course_score: 85, // Example score
            completed_modules: Object.values({ ...userProgress, [courseId]: progress })
              .filter(p => p >= 90).length
          })
          .eq('user_id', user?.id);
      }
      
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };
  
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const inProgressCourses = courses.filter(course => {
    const progress = userProgress[course.id];
    return progress !== undefined && progress > 0 && progress < 90;
  });
  
  const completedCourses = courses.filter(course => {
    const progress = userProgress[course.id];
    return progress !== undefined && progress >= 90;
  });

  const handleBrowseCourses = () => {
    // Use querySelector with the proper attribute selector
    const allCoursesTab = document.querySelector('[data-value="all-courses"]');
    if (allCoursesTab instanceof HTMLElement) {
      allCoursesTab.click();
    }
  };
  
  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
  };
  
  const handleBackToCourses = () => {
    setSelectedCourse(null);
  };
  
  const handleVideoProgress = (courseId: string, progress: number) => {
    updateProgress(courseId, progress);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>
          <p className="mt-2 text-gray-600">
            Enhance your interview skills with our curated learning content
          </p>
        </div>
        
        {selectedCourse ? (
          // Course video view
          <div className="space-y-6">
            <Button variant="outline" onClick={handleBackToCourses} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>{selectedCourse.title}</CardTitle>
                <CardDescription>{selectedCourse.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPlayer 
                  videoUrl={selectedCourse.videoUrl || ''} 
                  onProgress={(progress) => handleVideoProgress(selectedCourse.id, progress)}
                  initialProgress={userProgress[selectedCourse.id] || 0}
                />
              </CardContent>
            </Card>
            
            {/* Course materials, if any */}
            <Card>
              <CardHeader>
                <CardTitle>Course Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">Course notes (PDF)</span>
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">Practice questions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Course listing view
          <>
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search courses by title, description, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            <Tabs defaultValue="all-courses" className="space-y-4">
              <TabsList>
                <TabsTrigger value="all-courses" data-value="all-courses">All Courses</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="presentation">Presentation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all-courses">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCourses.map((course) => (
                    <CourseCard 
                      key={course.id} 
                      {...course} 
                      progress={userProgress[course.id] || 0} 
                      onClick={() => handleSelectCourse(course)}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="in-progress">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {inProgressCourses.length > 0 ? (
                    inProgressCourses.map((course) => (
                      <CourseCard 
                        key={course.id} 
                        {...course} 
                        progress={userProgress[course.id] || 0}
                        onClick={() => handleSelectCourse(course)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center">
                      <h3 className="mb-2 text-lg font-medium">No courses in progress</h3>
                      <p className="mb-4 text-gray-600">Start learning by enrolling in one of our courses.</p>
                      <Button onClick={handleBrowseCourses}>
                        Browse Courses
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {completedCourses.length > 0 ? (
                    completedCourses.map((course) => (
                      <CourseCard 
                        key={course.id} 
                        {...course} 
                        progress={userProgress[course.id] || 0}
                        onClick={() => handleSelectCourse(course)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center">
                      <h3 className="mb-2 text-lg font-medium">No completed courses</h3>
                      <p className="mb-4 text-gray-600">Complete a course to see it here.</p>
                      <Button onClick={handleBrowseCourses}>
                        Browse Courses
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="behavioral">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCourses
                    .filter(course => course.category === 'Behavioral')
                    .map((course) => (
                      <CourseCard 
                        key={course.id} 
                        {...course} 
                        progress={userProgress[course.id] || 0}
                        onClick={() => handleSelectCourse(course)}
                      />
                    ))
                  }
                </div>
              </TabsContent>
              
              <TabsContent value="technical">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCourses
                    .filter(course => course.category === 'Technical')
                    .map((course) => (
                      <CourseCard 
                        key={course.id} 
                        {...course} 
                        progress={userProgress[course.id] || 0}
                        onClick={() => handleSelectCourse(course)}
                      />
                    ))
                  }
                </div>
              </TabsContent>
              
              <TabsContent value="presentation">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCourses
                    .filter(course => course.category === 'Presentation')
                    .map((course) => (
                      <CourseCard 
                        key={course.id} 
                        {...course} 
                        progress={userProgress[course.id] || 0}
                        onClick={() => handleSelectCourse(course)}
                      />
                    ))
                  }
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
