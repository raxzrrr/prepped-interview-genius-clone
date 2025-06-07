import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoPlayer from '@/components/Learning/VideoPlayer';
import CourseList from '@/components/Learning/CourseList';
import AssessmentSection from '@/components/Learning/AssessmentSection';
import { useLearningData } from '@/hooks/useLearningData';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateConsistentUUID } from '@/utils/userUtils';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Module {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  locked: boolean;
  completed: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  progress: number;
}

const coursesData: Course[] = [
  {
    id: 'interview-mastery',
    title: 'Interview Mastery Course',
    description: 'Master technical and behavioral interviews with this comprehensive course.',
    modules: [
      {
        id: 'module-1',
        title: 'Introduction to Technical Interviews',
        description: 'Overview of what to expect in technical interviews and how to prepare.',
        videoUrl: 'https://www.youtube.com/embed/PJl4iabBEz0',
        duration: '15:30',
        locked: false,
        completed: false
      },
      {
        id: 'module-2',
        title: 'Algorithm Problems Walkthrough',
        description: 'Practical guide to solving algorithm problems in interviews.',
        videoUrl: 'https://www.youtube.com/embed/zHczhZn-z30',
        duration: '23:45',
        locked: false,
        completed: false
      },
      {
        id: 'module-3',
        title: 'System Design Interview Techniques',
        description: 'Learn how to approach system design questions effectively.',
        videoUrl: 'https://www.youtube.com/embed/q0KGYwNbf-0',
        duration: '28:15',
        locked: false,
        completed: false
      },
      {
        id: 'module-4',
        title: 'Behavioral Questions Mastery',
        description: 'How to structure and deliver compelling stories for behavioral questions.',
        videoUrl: 'https://www.youtube.com/embed/9FgfsL9B9Us',
        duration: '19:10',
        locked: false,
        completed: false
      },
      {
        id: 'module-5',
        title: 'Mock Interview Simulation',
        description: 'Real-world simulation of a complete technical interview.',
        videoUrl: 'https://www.youtube.com/embed/1qw5ITr3k9E',
        duration: '45:00',
        locked: false,
        completed: false
      }
    ],
    progress: 0
  },
  {
    id: 'assessment',
    title: 'Technical Assessment',
    description: 'Test your skills with this comprehensive technical assessment.',
    modules: [
      {
        id: 'assessment-intro',
        title: 'Assessment Instructions',
        description: 'Overview of the assessment format and guidelines.',
        videoUrl: 'https://www.youtube.com/embed/Ct7D62sHrZE',
        duration: '5:30',
        locked: false,
        completed: false
      },
      {
        id: 'assessment-test',
        title: 'Technical Assessment Test',
        description: 'Take the 30-minute technical assessment to earn your certificate.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        duration: '30:00',
        locked: false,
        completed: false
      }
    ],
    progress: 0
  }
];

const LearningPage: React.FC = () => {
  const { user, isStudent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState<Course[]>(coursesData);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  const totalModules = coursesData.reduce((count, course) => count + course.modules.length, 0);
  const { userLearningData, loading: learningLoading, error: learningError, updateModuleCompletion } = useLearningData(totalModules);
  
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    updateCoursesWithUserProgress();
  }, [userLearningData]);
  
  const updateCoursesWithUserProgress = () => {
    console.log('Updating courses with user progress:', userLearningData?.course_progress);
    
    const updatedCourses = coursesData.map(course => {
      const courseProgress = userLearningData?.course_progress?.[course.id] || {};
      
      const updatedModules = course.modules.map((module) => ({
        ...module,
        locked: false,
        completed: courseProgress[module.id] === true
      }));
      
      const completedCount = updatedModules.filter(m => m.completed).length;
      const progress = updatedModules.length > 0 
        ? Math.round((completedCount / updatedModules.length) * 100)
        : 0;
      
      return {
        ...course,
        modules: updatedModules,
        progress
      };
    });
    
    setCourses(updatedCourses);
  };
  
  const handleModuleSelect = (module: Module) => {
    setSelectedModule(module);
  };
  
  const handleModuleProgress = async (moduleId: string, progress: number) => {
    if (progress >= 100) {
      await handleModuleCompleted(moduleId);
    }
  };
  
  const handleModuleCompleted = async (moduleId: string) => {
    console.log('Module completed:', moduleId);
    
    let courseId = '';
    
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      const moduleIndex = course.modules.findIndex(m => m.id === moduleId);
      if (moduleIndex >= 0) {
        courseId = course.id;
        break;
      }
    }
    
    if (!courseId) {
      console.error('Course not found for module:', moduleId);
      return;
    }
    
    const success = await updateModuleCompletion(moduleId, courseId);
    if (!success) return;
    
    // Force update courses with new progress
    setTimeout(() => {
      updateCoursesWithUserProgress();
    }, 100);
    
    // Check for course completion
    if (courseId === 'interview-mastery') {
      const course = courses.find(c => c.id === courseId);
      if (course && user) {
        const allModulesCompleted = course.modules.every(
          m => userLearningData?.course_progress?.[courseId]?.[m.id] === true || m.id === moduleId
        );
        
        if (allModulesCompleted) {
          try {
            await supabase
              .from('user_learning')
              .update({
                course_score: 85,
                course_completed_at: new Date().toISOString()
              })
              .eq('user_id', generateConsistentUUID(user.id));
              
            toast({
              title: "Course Completed!",
              description: "Congratulations! You've completed the Interview Mastery Course!",
            });
          } catch (error) {
            console.error('Error updating course completion:', error);
          }
        }
      }
    }
  };

  const getNextModule = (currentModuleId: string): Module | null => {
    for (const course of courses) {
      const currentIndex = course.modules.findIndex(m => m.id === currentModuleId);
      if (currentIndex >= 0) {
        if (currentIndex < course.modules.length - 1) {
          return course.modules[currentIndex + 1];
        }
      }
    }
    return null;
  };

  const handleAdvanceToNext = () => {
    if (!selectedModule) return;
    
    const nextModule = getNextModule(selectedModule.id);
    if (nextModule) {
      toast({
        title: "Module Completed",
        description: "Moving to the next module...",
      });
      setTimeout(() => {
        setSelectedModule(nextModule);
      }, 500);
    } else {
      toast({
        title: "Module Completed",
        description: "You've completed the last module in this course!",
      });
    }
  };

  const handleMarkAsCompletedFromList = async (moduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    console.log('Mark as completed clicked for module:', moduleId);
    await handleModuleCompleted(moduleId);
  };
  
  if (learningLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your learning progress...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>
          <p className="mt-2 text-gray-600">
            Access courses and certifications to enhance your interview skills
          </p>
        </div>
        
        {learningError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {learningError}. Progress will be saved locally.
            </AlertDescription>
          </Alert>
        )}
        
        {selectedModule ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setSelectedModule(null)}
              >
                Back to Courses
              </button>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <VideoPlayer 
                videoUrl={selectedModule.videoUrl}
                onProgress={(progress) => handleModuleProgress(selectedModule.id, progress)}
                initialProgress={0}
                moduleId={selectedModule.id}
                onCompleted={handleModuleCompleted}
                onAdvanceToNext={handleAdvanceToNext}
              />
              
              <div className="mt-6 space-y-4">
                <h3 className="text-xl font-semibold">{selectedModule.title}</h3>
                <p className="text-gray-600">{selectedModule.description}</p>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses">
              <CourseList
                courses={courses.filter(course => course.id !== 'assessment')}
                onModuleSelect={handleModuleSelect}
                onMarkAsCompleted={handleMarkAsCompletedFromList}
              />
            </TabsContent>
            
            <TabsContent value="assessment">
              <AssessmentSection
                courses={courses}
                userLearningData={userLearningData}
                onModuleSelect={handleModuleSelect}
                onMarkAsCompleted={handleMarkAsCompletedFromList}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
