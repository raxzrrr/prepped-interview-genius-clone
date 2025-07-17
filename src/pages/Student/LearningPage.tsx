
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoPlayer from '@/components/Learning/VideoPlayer';
import AssessmentQuiz from '@/components/Learning/AssessmentQuiz';
import CategoryVideoList from '@/components/Learning/CategoryVideoList';
import CourseCard from '@/components/Learning/CourseCard';
import CourseAssessmentTab from '@/components/Learning/CourseAssessmentTab';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Loader2, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProFeatureGuard from '@/components/ProFeatureGuard';
import { useCourseData } from '@/hooks/useCourseData';
import { Course, CourseVideo } from '@/services/courseService';

const LearningPage: React.FC = () => {
  const { user, isStudent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CourseVideo | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  
  const {
    courses,
    videos,
    userLearningData,
    loading: courseLoading,
    error: courseError,
    getCourseProgress,
    getCourseVideoCount,
    updateVideoCompletion,
    removeVideoCompletion
  } = useCourseData();
  
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

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course);
    setSelectedVideo(null);
  };

  const handleVideoSelect = (video: CourseVideo) => {
    setSelectedVideo(video);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedVideo(null);
  };

  const handleBackToVideoList = () => {
    setSelectedVideo(null);
  };

  const handleStartCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      handleCourseSelect(course);
    }
  };

  const handleMarkAsCompleted = async (videoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedCourse) return;
    
    const success = await updateVideoCompletion(videoId, selectedCourse.id);
    if (success) {
      toast({
        title: "Video Completed",
        description: "Great job! Keep up the learning momentum.",
      });
    }
  };

  const handleMarkAsIncomplete = async (videoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedCourse) return;
    
    const success = await removeVideoCompletion(videoId, selectedCourse.id);
    if (success) {
      toast({
        title: "Video Marked Incomplete",
        description: "Video has been unmarked as completed.",
      });
    }
  };

  const handleVideoProgress = async (videoId: string, progress: number) => {
    if (progress >= 100 && selectedCourse) {
      await updateVideoCompletion(videoId, selectedCourse.id);
    }
  };

  const handleVideoCompleted = async (videoId: string) => {
    if (selectedCourse) {
      await updateVideoCompletion(videoId, selectedCourse.id);
    }
  };

  const getVideoProgress = (videoId: string): boolean => {
    if (!selectedCourse || !userLearningData?.course_progress_new) return false;
    const courseProgress = userLearningData.course_progress_new[selectedCourse.id] || {};
    return courseProgress[videoId] === true;
  };

  const handleAdvanceToNext = () => {
    if (!selectedVideo || !selectedCourse) return;
    
    const courseVideos = videos[selectedCourse.id] || [];
    const currentIndex = courseVideos.findIndex(v => v.id === selectedVideo.id);
    
    if (currentIndex >= 0 && currentIndex < courseVideos.length - 1) {
      const nextVideo = courseVideos[currentIndex + 1];
      setSelectedVideo(nextVideo);
      toast({
        title: "Video Completed",
        description: "Moving to the next video...",
      });
    } else {
      toast({
        title: "Video Completed",
        description: "You've completed the last video in this course!",
      });
    }
  };

  const handleGlobalAssessmentComplete = async (score: number) => {
    setShowAssessment(false);
    toast({
      title: "Assessment Completed!",
      description: `You scored ${score}%! ${score >= 80 ? 'Excellent work!' : 'Keep practicing to improve your score.'}`,
    });
  };

  // Safe progress calculation with proper bounds checking
  const calculateCourseProgress = (courseId: string): number => {
    const courseVideos = videos[courseId] || [];
    if (courseVideos.length === 0) return 0;
    
    const completedVideos = courseVideos.filter(video => {
      if (!userLearningData?.course_progress_new) return false;
      const courseProgress = userLearningData.course_progress_new[courseId] || {};
      return courseProgress[video.id] === true;
    }).length;
    
    const progress = (completedVideos / courseVideos.length) * 100;
    return Math.min(Math.max(Math.round(progress), 0), 100);
  };

  if (courseLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading courses...</span>
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
          
          <ProFeatureGuard 
            featureName="Assessment & Certification"
            description="Take our comprehensive technical assessment and earn your professional certificate. This feature is available to Pro subscribers only."
          >
            <AssessmentQuiz
              onComplete={handleGlobalAssessmentComplete}
              onClose={() => setShowAssessment(false)}
            />
          </ProFeatureGuard>
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
            Access courses and certifications to enhance your skills
          </p>
        </div>
        
        <ProFeatureGuard 
          featureName="Learning Hub"
          description="Access our comprehensive library of courses, video tutorials, and earn professional certificates. Upgrade to Pro to unlock the full learning experience."
        >
          {courseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {courseError}. Some features may be limited.
              </AlertDescription>
            </Alert>
          )}
          
          {selectedVideo ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedVideo.title}</h2>
                <Button 
                  variant="outline"
                  onClick={handleBackToVideoList}
                >
                  Back to Videos
                </Button>
              </div>
              
              <div className="bg-white rounded-lg border p-6">
                <VideoPlayer 
                  videoUrl={selectedVideo.video_url}
                  onProgress={(progress) => handleVideoProgress(selectedVideo.id, progress)}
                  initialProgress={getVideoProgress(selectedVideo.id) ? 100 : 0}
                  moduleId={selectedVideo.id}
                  onCompleted={handleVideoCompleted}
                  onAdvanceToNext={handleAdvanceToNext}
                />
                
                <div className="mt-6 space-y-4">
                  <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
                  <p className="text-gray-600">{selectedVideo.description}</p>
                </div>
              </div>
            </div>
          ) : selectedCourse ? (
            <CategoryVideoList
              category={selectedCourse}
              videos={videos[selectedCourse.id] || []}
              onVideoSelect={handleVideoSelect}
              onMarkAsCompleted={handleMarkAsCompleted}
              onMarkAsIncomplete={handleMarkAsIncomplete}
              onBackToCategories={handleBackToCourses}
              getVideoProgress={getVideoProgress}
            />
          ) : (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => {
                    const courseProgress = calculateCourseProgress(course.id);
                    const videoCount = getCourseVideoCount(course.id);
                    
                    return (
                      <CourseCard
                        key={course.id}
                        course={course}
                        progress={courseProgress}
                        videoCount={videoCount}
                        onStartCourse={handleStartCourse}
                        showAssessmentButton={false}
                      />
                    );
                  })}
                </div>
              </TabsContent>
              
              <TabsContent value="assessment">
                <CourseAssessmentTab
                  courses={courses}
                  calculateCourseProgress={calculateCourseProgress}
                  userLearningData={userLearningData}
                />
              </TabsContent>
            </Tabs>
          )}
        </ProFeatureGuard>
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
