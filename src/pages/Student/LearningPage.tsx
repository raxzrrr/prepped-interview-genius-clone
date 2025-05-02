
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import VideoPlayer from '@/components/Learning/VideoPlayer';
import { BookOpen, Check, CheckCircle2, Lock, Play, PlayCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Json } from '@/integrations/supabase/types';

// Define an interface for the user learning data
interface UserLearningData {
  id: string;
  user_id: string;
  course_progress: Record<string, any>;
  completed_modules: number;
  total_modules: number;
  course_score: number | null;
  course_completed_at: string | null;
  assessment_attempted: boolean;
  assessment_score: number | null;
  assessment_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

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

const LearningPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [userLearningData, setUserLearningData] = useState<UserLearningData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }
  
  // Sample course data
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
          locked: true,
          completed: false
        },
        {
          id: 'module-4',
          title: 'Behavioral Questions Mastery',
          description: 'How to structure and deliver compelling stories for behavioral questions.',
          videoUrl: 'https://www.youtube.com/embed/9FgfsL9B9Us',
          duration: '19:10',
          locked: true,
          completed: false
        },
        {
          id: 'module-5',
          title: 'Mock Interview Simulation',
          description: 'Real-world simulation of a complete technical interview.',
          videoUrl: 'https://www.youtube.com/embed/1qw5ITr3k9E',
          duration: '45:00',
          locked: true,
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
          locked: true,
          completed: false
        }
      ],
      progress: 0
    }
  ];
  
  // Fetch user learning data
  useEffect(() => {
    if (user) {
      fetchUserLearningData();
    }
  }, [user]);
  
  // Update courses data with user progress
  useEffect(() => {
    if (userLearningData) {
      updateCoursesWithUserProgress();
    } else {
      setCourses(coursesData);
    }
    
    setLoading(false);
  }, [userLearningData]);
  
  const fetchUserLearningData = async () => {
    try {
      console.log("Fetching user learning data for user ID:", user?.id);
      
      // Try to get existing learning data
      const { data: existingData, error } = await supabase
        .from('user_learning')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (existingData) {
        console.log("Found existing learning data:", existingData);
        
        // Cast the course_progress from Json to Record<string, any>
        setUserLearningData({
          ...existingData,
          course_progress: existingData.course_progress as Record<string, any> || {}
        });
      } else {
        console.log("No existing learning data found, creating new record");
        
        // Create new learning data for the user
        const newLearningData = {
          user_id: user?.id,
          course_progress: {},
          completed_modules: 0,
          total_modules: coursesData.reduce((count, course) => count + course.modules.length, 0)
        };
        
        const { data: createdData, error: createError } = await supabase
          .from('user_learning')
          .insert(newLearningData)
          .select('*')
          .single();
        
        if (createError) {
          throw createError;
        }
        
        if (createdData) {
          console.log("Created new learning data:", createdData);
          
          setUserLearningData({
            ...createdData,
            course_progress: createdData.course_progress as Record<string, any> || {}
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user learning data:', error);
      // Use default courses data
      setCourses(coursesData);
      setLoading(false);
    }
  };
  
  const updateCoursesWithUserProgress = () => {
    if (!userLearningData || !userLearningData.course_progress) {
      setCourses(coursesData);
      return;
    }
    
    console.log("Updating courses with user progress:", userLearningData.course_progress);
    
    const updatedCourses = coursesData.map(course => {
      const courseProgress = userLearningData.course_progress[course.id] || {};
      
      // Update modules with completion status
      const updatedModules = course.modules.map((module, index) => {
        // Check if this module is completed
        const moduleCompleted = courseProgress[module.id] === true;
        
        // A module is locked if there are previous modules that aren't completed
        // but the first module is always unlocked
        const previousModuleCompleted = index === 0 || 
          (index > 0 && courseProgress[course.modules[index - 1].id] === true);
          
        return {
          ...module,
          locked: index > 0 && !previousModuleCompleted,
          completed: moduleCompleted
        };
      });
      
      // Calculate course progress percentage
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
    
    console.log("Updated courses with progress:", updatedCourses);
    setCourses(updatedCourses);
  };
  
  const handleModuleSelect = (module: Module) => {
    if (module.locked) {
      toast({
        title: "Module Locked",
        description: "Complete the previous module to unlock this content.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedModule(module);
  };
  
  const handleModuleProgress = async (moduleId: string, progress: number) => {
    console.log(`Module ${moduleId} progress: ${progress}%`);
    
    // Consider a module complete when progress reaches 100%
    if (progress >= 90) {
      await markModuleAsCompleted(moduleId);
    }
  };
  
  const markModuleAsCompleted = async (moduleId: string) => {
    if (!userLearningData || !user?.id) return;
    
    try {
      console.log(`Marking module ${moduleId} as completed`);
      
      // Find which course the module belongs to
      let courseId = '';
      let currentCourseIndex = -1;
      let currentModuleIndex = -1;
      
      for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const moduleIndex = course.modules.findIndex(m => m.id === moduleId);
        if (moduleIndex >= 0) {
          courseId = course.id;
          currentCourseIndex = i;
          currentModuleIndex = moduleIndex;
          break;
        }
      }
      
      if (!courseId) {
        console.error("Could not find course for module:", moduleId);
        return;
      }
      
      console.log(`Module ${moduleId} belongs to course ${courseId}`);
      
      // Update the course progress in the user learning data
      const courseProgress = {
        ...(userLearningData.course_progress || {}),
      };
      
      if (!courseProgress[courseId]) {
        courseProgress[courseId] = {};
      }
      
      // Mark the current module as completed
      courseProgress[courseId][moduleId] = true;
      
      console.log("Updated course progress:", courseProgress);
      
      // Count completed modules
      let completedModulesCount = 0;
      Object.values(courseProgress).forEach(course => {
        if (course) {
          Object.values(course as Record<string, boolean>).forEach(completed => {
            if (completed) completedModulesCount++;
          });
        }
      });
      
      console.log(`Total completed modules: ${completedModulesCount}`);
      
      // Update database
      const { error } = await supabase
        .from('user_learning')
        .update({
          course_progress: courseProgress,
          completed_modules: completedModulesCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Error updating user_learning record:", error);
        throw error;
      }
      
      console.log("Successfully updated user_learning record in database");
      
      // Update local state with the new data
      setUserLearningData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          course_progress: courseProgress,
          completed_modules: completedModulesCount
        };
      });
      
      // Refresh the courses data to update the UI
      updateCoursesWithUserProgress();
      
      // Check if all modules in the course are completed
      if (courseId === 'interview-mastery') {
        const course = courses.find(c => c.id === courseId);
        if (course) {
          const allModulesCompleted = course.modules.every(
            m => courseProgress[courseId]?.[m.id] === true
          );
          
          if (allModulesCompleted) {
            console.log("All modules in course completed, marking course as completed");
            
            // Mark the course as completed
            await supabase
              .from('user_learning')
              .update({
                course_score: 85, // Example score
                course_completed_at: new Date().toISOString()
              })
              .eq('user_id', user.id);
              
            toast({
              title: "Course Completed!",
              description: "Congratulations! You've completed the Interview Mastery Course!",
            });
          }
        }
      }
      
      // Auto-advance to next module if available
      if (currentCourseIndex >= 0 && currentModuleIndex >= 0) {
        const course = courses[currentCourseIndex];
        if (currentModuleIndex < course.modules.length - 1) {
          const nextModule = course.modules[currentModuleIndex + 1];
          // Check if the next module is not locked
          const nextModuleLocked = nextModule.locked;
          
          if (!nextModuleLocked) {
            console.log(`Auto-advancing to next module: ${nextModule.id}`);
            
            toast({
              title: "Module Completed",
              description: "Moving to the next module...",
            });
            setTimeout(() => {
              setSelectedModule(nextModule);
            }, 1500);
          } else {
            console.log("Next module is locked, not auto-advancing");
            // We'll unlock it on the next render with the updated progress
            toast({
              title: "Module Completed",
              description: "The next module has been unlocked!",
            });
            // Force an update of the courses to unlock the next module
            updateCoursesWithUserProgress();
          }
        } else {
          console.log("This was the last module in the course");
          toast({
            title: "Module Completed",
            description: "You've completed the last module in this course!",
          });
        }
      }
      
    } catch (error) {
      console.error('Error marking module as completed:', error);
      toast({
        title: "Error",
        description: "Failed to update your progress. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>
          <p className="mt-2 text-gray-600">
            Access courses and certifications to enhance your interview skills
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-purple"></div>
          </div>
        ) : selectedModule ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
              <Button variant="outline" onClick={() => setSelectedModule(null)}>
                Back to Courses
              </Button>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <VideoPlayer 
                  videoUrl={selectedModule.videoUrl}
                  onProgress={(progress) => handleModuleProgress(selectedModule.id, progress)}
                  initialProgress={0}
                />
                
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-semibold">{selectedModule.title}</h3>
                  <p className="text-gray-600">{selectedModule.description}</p>
                  
                  {selectedModule.completed && (
                    <div className="flex items-center text-green-500">
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses">
              <div className="space-y-6">
                {courses
                  .filter(course => course.id !== 'assessment')
                  .map(course => (
                  <Card key={course.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{course.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {course.description}
                          </CardDescription>
                        </div>
                        <Badge className={course.progress === 100 ? "bg-green-500" : "bg-brand-purple"}>
                          {course.progress}% Complete
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      
                      <div className="space-y-4">
                        {course.modules.map((module, index) => (
                          <div key={module.id} 
                               className={`flex items-start p-3 border rounded-lg ${
                                 module.completed 
                                   ? 'border-green-200 bg-green-50' 
                                   : module.locked 
                                     ? 'border-gray-200 bg-gray-50 opacity-75' 
                                     : 'border-gray-200 hover:border-brand-purple/50 hover:bg-brand-purple/5 cursor-pointer'
                               }`}
                               onClick={() => handleModuleSelect(module)}
                          >
                            <div className="mr-4 mt-1">
                              {module.completed ? (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-500">
                                  <Check className="h-5 w-5" />
                                </div>
                              ) : module.locked ? (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400">
                                  <Lock className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple">
                                  <PlayCircle className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className={`font-medium ${module.locked ? 'text-gray-500' : ''}`}>
                                  {index + 1}. {module.title}
                                </h4>
                                <span className="text-sm text-gray-500">{module.duration}</span>
                              </div>
                              <p className={`text-sm mt-1 ${module.locked ? 'text-gray-400' : 'text-gray-600'}`}>
                                {module.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {course.modules.filter(m => m.completed).length} of {course.modules.length} modules completed
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={!course.modules.some(m => !m.locked && !m.completed)}
                          onClick={() => {
                            const nextModule = course.modules.find(m => !m.locked && !m.completed);
                            if (nextModule) {
                              handleModuleSelect(nextModule);
                            }
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Continue Learning
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="assessment">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Technical Assessment</CardTitle>
                      <CardDescription className="mt-1">
                        Test your technical interview skills and earn a certificate
                      </CardDescription>
                    </div>
                    {userLearningData?.assessment_completed_at ? (
                      <Badge className="bg-green-500">Completed</Badge>
                    ) : userLearningData?.assessment_attempted ? (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">In Progress</Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-500 text-gray-500">Not Started</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-amber-500 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-amber-800">Assessment Requirements</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        You must complete the Interview Mastery Course before taking the assessment.
                        The assessment consists of 30 multiple-choice questions and requires a score of 80% or higher to earn a certificate.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-brand-purple/5 hover:border-brand-purple/50"
                         onClick={() => {
                           const module = courses
                             .find(c => c.id === 'assessment')
                             ?.modules.find(m => m.id === 'assessment-intro');
                           if (module) handleModuleSelect(module);
                         }}
                    >
                      <div className="mr-4 mt-1">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple">
                          <BookOpen className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium">Assessment Instructions</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Learn about the assessment format and preparation tips
                        </p>
                      </div>
                    </div>
                    
                    <div className={`flex items-start p-3 border rounded-lg ${
                      userLearningData?.assessment_completed_at
                        ? 'border-green-200 bg-green-50'
                        : courses.find(c => c.id === 'interview-mastery')?.progress === 100
                          ? 'cursor-pointer hover:bg-brand-purple/5 hover:border-brand-purple/50'
                          : 'opacity-75 bg-gray-50'
                    }`}
                         onClick={() => {
                           if (courses.find(c => c.id === 'interview-mastery')?.progress === 100) {
                             const module = courses
                               .find(c => c.id === 'assessment')
                               ?.modules.find(m => m.id === 'assessment-test');
                             if (module) handleModuleSelect(module);
                           } else {
                             toast({
                               title: "Assessment Locked",
                               description: "Complete the Interview Mastery Course to unlock the assessment.",
                               variant: "destructive"
                             });
                           }
                         }}
                    >
                      <div className="mr-4 mt-1">
                        {userLearningData?.assessment_completed_at ? (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-500">
                            <Check className="h-5 w-5" />
                          </div>
                        ) : courses.find(c => c.id === 'interview-mastery')?.progress === 100 ? (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple">
                            <PlayCircle className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400">
                            <Lock className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <h4 className={`font-medium ${courses.find(c => c.id === 'interview-mastery')?.progress !== 100 && !userLearningData?.assessment_completed_at ? 'text-gray-500' : ''}`}>
                            Technical Assessment Test
                          </h4>
                          <span className="text-sm text-gray-500">30 min</span>
                        </div>
                        <p className={`text-sm mt-1 ${courses.find(c => c.id === 'interview-mastery')?.progress !== 100 && !userLearningData?.assessment_completed_at ? 'text-gray-400' : 'text-gray-600'}`}>
                          Take the timed assessment to test your interview skills and knowledge
                        </p>
                        {userLearningData?.assessment_completed_at && userLearningData?.assessment_score !== null && (
                          <div className="mt-2 flex items-center">
                            <span className="text-sm font-medium mr-2">Your score:</span>
                            <span className={`text-sm font-bold ${
                              (userLearningData.assessment_score || 0) >= 80 
                                ? 'text-green-500' 
                                : 'text-amber-500'
                            }`}>
                              {userLearningData.assessment_score}%
                            </span>
                            {(userLearningData.assessment_score || 0) >= 80 && (
                              <span className="ml-2 text-sm text-green-500 flex items-center">
                                <Check className="h-3 w-3 mr-1" /> Passed
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {userLearningData?.assessment_completed_at && (userLearningData?.assessment_score || 0) >= 80 ? (
                    <Button variant="outline" onClick={() => window.location.href = '/certificates'}>
                      View Certificate
                    </Button>
                  ) : courses.find(c => c.id === 'interview-mastery')?.progress === 100 ? (
                    <Button onClick={() => {
                      const module = courses
                        .find(c => c.id === 'assessment')
                        ?.modules.find(m => m.id === 'assessment-test');
                      if (module) handleModuleSelect(module);
                    }}>
                      Start Assessment
                    </Button>
                  ) : (
                    <Button disabled>
                      Complete Course First
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
