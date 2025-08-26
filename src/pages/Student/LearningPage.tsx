
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Play, CheckCircle, Award, Video, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProFeatureGuard from '@/components/ProFeatureGuard';
import SimpleAssessment from '@/components/Learning/SimpleAssessment';
import { useSimpleLearning } from '@/hooks/useSimpleLearning';
import { Course, CourseVideo } from '@/services/courseService';

const LearningPage: React.FC = () => {
  const { user, isStudent, loading: authLoading } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<CourseVideo | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentCourse, setAssessmentCourse] = useState<{ id: string; name: string } | null>(null);

  const {
    courses,
    videos,
    loading,
    error,
    toggleVideoCompletion,
    getCourseProgress,
    isCourseCompleted,
    isVideoCompleted,
    courseHasQuestions
  } = useSimpleLearning();

  if (authLoading || loading) {
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

  const handleStartAssessment = async (course: Course) => {
    const hasQuestions = await courseHasQuestions(course.id);
    if (!hasQuestions) {
      return;
    }
    
    setAssessmentCourse({ id: course.id, name: course.name });
    setShowAssessment(true);
  };

  const handleAssessmentComplete = (passed: boolean, score: number) => {
    setShowAssessment(false);
    setAssessmentCourse(null);
    // Trigger data refresh without full page reload
    window.location.reload();
  };

  const handleVideoClick = (video: CourseVideo) => {
    setSelectedVideo(video);
  };

  const handleBackToCourse = () => {
    setSelectedVideo(null);
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedVideo(null);
  };

  // Show assessment if active
  if (showAssessment && assessmentCourse) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assessment</h1>
            <p className="mt-2 text-muted-foreground">
              Complete the assessment for {assessmentCourse.name}
            </p>
          </div>
          
          <ProFeatureGuard 
            featureName="Course Assessment"
            description="Take assessments to earn certificates and validate your learning."
          >
            <SimpleAssessment
              courseId={assessmentCourse.id}
              courseName={assessmentCourse.name}
              totalModules={videos[assessmentCourse.id]?.length || 0}
              onComplete={handleAssessmentComplete}
              onCancel={() => {
                setShowAssessment(false);
                setAssessmentCourse(null);
              }}
            />
          </ProFeatureGuard>
        </div>
      </DashboardLayout>
    );
  }

  // Show video player if video selected
  if (selectedVideo && selectedCourse) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{selectedVideo.title}</h1>
              <p className="text-muted-foreground">{selectedCourse.name}</p>
            </div>
            <Button variant="outline" onClick={handleBackToCourse}>
              Back to Course
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
                {selectedVideo.video_url ? (
                <video 
                  controls 
                  preload="metadata"
                  className="w-full h-full rounded-lg"
                  src={selectedVideo.video_url}
                >
                  Your browser does not support the video tag.
                </video>
                ) : (
                  <div className="text-white text-center">
                    <Video className="h-12 w-12 mx-auto mb-2" />
                    <p>Video not available</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                  <p className="text-muted-foreground">{selectedVideo.description}</p>
                </div>
                <Button
                  onClick={() => toggleVideoCompletion(selectedCourse.id, selectedVideo.id)}
                  variant={isVideoCompleted(selectedCourse.id, selectedVideo.id) ? "default" : "outline"}
                >
                  {isVideoCompleted(selectedCourse.id, selectedVideo.id) ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    "Mark Complete"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show course videos if course selected
  if (selectedCourse) {
    const courseVideos = videos[selectedCourse.id] || [];
    const progress = getCourseProgress(selectedCourse.id);
    const completed = isCourseCompleted(selectedCourse.id);

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{selectedCourse.name}</h1>
              <p className="text-muted-foreground">{selectedCourse.description}</p>
            </div>
            <Button variant="outline" onClick={handleBackToCourses}>
              Back to Courses
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Course Progress</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={completed ? "default" : "secondary"}>
                    {progress}% Complete
                  </Badge>
                </div>
              </div>
              <Progress value={progress} className="mt-2" />
            </CardHeader>
            <CardContent>
              {completed ? (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">Course Completed!</span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    You can now take the assessment to earn your certificate.
                  </p>
                  <Button 
                    onClick={() => handleStartAssessment(selectedCourse)}
                    className="mt-2"
                    size="sm"
                  >
                    Start Assessment
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Course Videos</h2>
            {courseVideos.map((video, index) => (
              <Card key={video.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {index + 1}.
                        </span>
                        <Play className="w-4 h-4 text-primary" />
                      </div>
                      <div onClick={() => handleVideoClick(video)}>
                        <h3 className="font-medium">{video.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {video.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVideoCompletion(selectedCourse.id, video.id);
                      }}
                      variant={isVideoCompleted(selectedCourse.id, video.id) ? "default" : "outline"}
                      size="sm"
                    >
                      {isVideoCompleted(selectedCourse.id, video.id) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </>
                      ) : (
                        "Mark Complete"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show courses list (main view)
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learning Hub</h1>
          <p className="mt-2 text-muted-foreground">
            Choose a course to start learning and earn certificates
          </p>
        </div>
        
        <ProFeatureGuard 
          featureName="Learning Hub"
          description="Access our comprehensive library of courses and earn professional certificates."
        >
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const progress = getCourseProgress(course.id);
              const videoCount = videos[course.id]?.length || 0;
              const completed = isCourseCompleted(course.id);

              return (
                <Card 
                  key={course.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={completed ? "default" : "secondary"}>
                          {progress}%
                        </Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {course.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={progress} className="h-2" />
                       <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>{videoCount} videos</span>
                        {completed ? (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            <Award className="w-3 h-3 mr-1" />
                            Ready for Assessment
                          </Badge>
                        ) : null}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={completed ? "default" : "outline"}
                      >
                        {progress === 0 
                          ? "Start Course" 
                          : completed 
                            ? "Take Assessment" 
                            : "Continue"
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {courses.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-lg font-medium mb-2">No courses available</h3>
                <p className="text-muted-foreground">
                  Check back later for new learning content.
                </p>
              </CardContent>
            </Card>
          )}
        </ProFeatureGuard>
      </div>
    </DashboardLayout>
  );
};

export default LearningPage;
