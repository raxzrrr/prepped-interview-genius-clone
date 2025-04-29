
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import CourseCard from '@/components/Learning/CourseCard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter } from 'lucide-react';

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
}

const LearningPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
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
      progress: 35
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
      progress: 80
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
      isPremium: false
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
      isPremium: true
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
      progress: 10
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
      isPremium: true
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
      isPremium: false
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
      isPremium: true
    }
  ];
  
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const inProgressCourses = courses.filter(course => course.progress !== undefined && course.progress > 0);

  const handleBrowseCourses = () => {
    // Use querySelector with the proper attribute selector
    const allCoursesTab = document.querySelector('[data-value="all-courses"]');
    if (allCoursesTab instanceof HTMLElement) {
      allCoursesTab.click();
    }
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
            <TabsTrigger value="all-courses">All Courses</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="presentation">Presentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-courses">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} {...course} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="in-progress">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {inProgressCourses.length > 0 ? (
                inProgressCourses.map((course) => (
                  <CourseCard key={course.id} {...course} />
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
          
          <TabsContent value="behavioral">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses
                .filter(course => course.category === 'Behavioral')
                .map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="technical">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses
                .filter(course => course.category === 'Technical')
                .map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))
              }
            </div>
          </TabsContent>
          
          <TabsContent value="presentation">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses
                .filter(course => course.category === 'Presentation')
                .map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
