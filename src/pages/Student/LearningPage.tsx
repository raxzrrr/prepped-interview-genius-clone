
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoPlayer from '@/components/Learning/VideoPlayer';
import AssessmentQuiz from '@/components/Learning/AssessmentQuiz';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Loader2, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProFeatureGuard from '@/components/ProFeatureGuard';
import CourseCategoryGrid from '@/components/Learning/CourseCategoryGrid';
import CategoryVideoList from '@/components/Learning/CategoryVideoList';
import { useCourseData } from '@/hooks/useCourseData';
import { CourseCategory, CourseVideo } from '@/services/courseService';

const LearningPage: React.FC = () => {
  const { user, isStudent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CourseVideo | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  
  const {
    categories,
    videos,
    userLearningData,
    loading: courseLoading,
    error: courseError,
    getCategoryProgress,
    getCategoryVideoCount,
    updateVideoCompletion
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

  const handleCategorySelect = (category: CourseCategory) => {
    setSelectedCategory(category);
    setSelectedVideo(null);
  };

  const handleVideoSelect = (video: CourseVideo) => {
    setSelectedVideo(video);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedVideo(null);
  };

  const handleBackToVideoList = () => {
    setSelectedVideo(null);
  };

  const handleMarkAsCompleted = async (videoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedCategory) return;
    
    const success = await updateVideoCompletion(videoId, selectedCategory.id);
    if (success) {
      toast({
        title: "Video Completed",
        description: "Great job! Keep up the learning momentum.",
      });
    }
  };

  const handleVideoProgress = async (videoId: string, progress: number) => {
    if (progress >= 100 && selectedCategory) {
      await updateVideoCompletion(videoId, selectedCategory.id);
    }
  };

  const handleVideoCompleted = async (videoId: string) => {
    if (selectedCategory) {
      await updateVideoCompletion(videoId, selectedCategory.id);
    }
  };

  const getVideoProgress = (videoId: string): boolean => {
    if (!selectedCategory || !userLearningData?.category_progress) return false;
    const categoryProgress = userLearningData.category_progress[selectedCategory.id] || {};
    return categoryProgress[videoId] === true;
  };

  const handleAdvanceToNext = () => {
    if (!selectedVideo || !selectedCategory) return;
    
    const categoryVideos = videos[selectedCategory.id] || [];
    const currentIndex = categoryVideos.findIndex(v => v.id === selectedVideo.id);
    
    if (currentIndex >= 0 && currentIndex < categoryVideos.length - 1) {
      const nextVideo = categoryVideos[currentIndex + 1];
      setSelectedVideo(nextVideo);
      toast({
        title: "Video Completed",
        description: "Moving to the next video...",
      });
    } else {
      toast({
        title: "Video Completed",
        description: "You've completed the last video in this category!",
      });
    }
  };

  const handleAssessmentComplete = async (score: number) => {
    setShowAssessment(false);
    toast({
      title: "Assessment Completed!",
      description: `You scored ${score}%! ${score >= 80 ? 'Excellent work!' : 'Keep practicing to improve your score.'}`,
    });
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
              onComplete={handleAssessmentComplete}
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
          ) : selectedCategory ? (
            <CategoryVideoList
              category={selectedCategory}
              videos={videos[selectedCategory.id] || []}
              onVideoSelect={handleVideoSelect}
              onMarkAsCompleted={handleMarkAsCompleted}
              onBackToCategories={handleBackToCategories}
              getVideoProgress={getVideoProgress}
            />
          ) : (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="courses">Courses</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses">
                <CourseCategoryGrid
                  categories={categories}
                  loading={courseLoading}
                  onCategorySelect={handleCategorySelect}
                  getCategoryProgress={getCategoryProgress}
                  getCategoryVideoCount={getCategoryVideoCount}
                />
              </TabsContent>
              
              <TabsContent value="assessment">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Award className="h-6 w-6 text-yellow-600" />
                      <CardTitle>Technical Assessment</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">
                      Test your knowledge with our comprehensive technical assessment. 
                      Complete courses to unlock assessments.
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
                    
                    <Button 
                      onClick={() => setShowAssessment(true)}
                      className="w-full sm:w-auto"
                    >
                      {userLearningData?.assessment_attempted ? 'Retake Assessment' : 'Start Assessment'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </ProFeatureGuard>
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
