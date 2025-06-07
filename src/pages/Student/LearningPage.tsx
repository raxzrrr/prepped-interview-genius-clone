import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoPlayer from '@/components/Learning/VideoPlayer';
import CourseList from '@/components/Learning/CourseList';
import AssessmentQuiz from '@/components/Learning/AssessmentQuiz';
import { useLearningData } from '@/hooks/useLearningData';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Loader2, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  }
];

const LearningPage: React.FC = () => {
  const { user, isStudent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState<Course[]>(coursesData);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  
  const totalModules = coursesData.reduce((count, course) => count + course.modules.length, 0);
  const { 
    userLearningData, 
    loading: learningLoading, 
    error: learningError, 
    updateModuleCompletion,
    updateAssessmentScore 
  } = useLearningData(totalModules);
  
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
    
    // Check for course completion - now using the updated logic from the hook
    if (courseId === 'interview-mastery') {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        const currentProgress = userLearningData?.course_progress?.[courseId] || {};
        const completedModules = Object.keys(currentProgress).filter(
          key => currentProgress[key] === true || key === moduleId
        ).length;
        
        if (completedModules >= 5) { // All 5 modules completed
          toast({
            title: "Course Completed!",
            description: "Congratulations! You've completed the Interview Mastery Course! You can now take the assessment.",
          });
        }
      }
    }
  };

  const handleAssessmentComplete = async (score: number) => {
    const success = await updateAssessmentScore(score);
    if (success) {
      setShowAssessment(false);
      toast({
        title: "Assessment Completed!",
        description: `You scored ${score}%! ${score >= 80 ? 'You can now view your certificate!' : 'Complete the course to earn your certificate.'}`,
      });
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

  const canTakeAssessment = () => {
    // Check if all interview mastery modules are completed
    const interviewProgress = userLearningData?.course_progress?.['interview-mastery'] || {};
    const completedModules = Object.keys(interviewProgress).filter(
      key => interviewProgress[key] === true
    ).length;
    
    return completedModules >= 5 || userLearningData?.course_completed_at !== null;
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

  if (showAssessment) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Technical Assessment</h1>
            <p className="mt-2 text-gray-600">
              Test your knowledge and earn your certificate
            </p>
          </div>
          
          <AssessmentQuiz
            onComplete={handleAssessmentComplete}
            onClose={() => setShowAssessment(false)}
          />
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
                courses={courses}
                onModuleSelect={handleModuleSelect}
                onMarkAsCompleted={handleMarkAsCompletedFromList}
              />
            </TabsContent>
            
            <TabsContent value="assessment">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-6 w-6 text-yellow-600" />
                    <CardTitle>Technical Interview Assessment</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Test your knowledge with our comprehensive technical interview assessment. 
                    Complete the course first to unlock the assessment.
                  </p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Assessment Status:</p>
                    {userLearningData?.assessment_attempted ? (
                      <p className="text-green-600">
                        Completed with score: {userLearningData.assessment_score}%
                      </p>
                    ) : (
                      <p className="text-gray-500">Not attempted</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Course Status:</p>
                    {canTakeAssessment() ? (
                      <p className="text-green-600">Course completed - Assessment unlocked!</p>
                    ) : (
                      <p className="text-orange-600">
                        Complete all modules to unlock assessment ({
                          Object.keys(userLearningData?.course_progress?.['interview-mastery'] || {}).filter(
                            key => userLearningData?.course_progress?.['interview-mastery']?.[key] === true
                          ).length
                        }/5 modules completed)
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => setShowAssessment(true)}
                    disabled={!canTakeAssessment()}
                    className="w-full sm:w-auto"
                  >
                    {userLearningData?.assessment_attempted ? 'Retake Assessment' : 'Start Assessment'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
