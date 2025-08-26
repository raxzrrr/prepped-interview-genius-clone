
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Lock, CheckCircle, BookOpen, Target, Trophy, Clock, Briefcase } from 'lucide-react';
import { Course } from '@/services/courseService';
import { UserLearningData } from '@/services/learningService';
import CourseAssessment from './CourseAssessment';
import JobRecommendations from './JobRecommendations';

interface CourseAssessmentTabProps {
  courses: Course[];
  calculateCourseProgress: (courseId: string) => number;
  userLearningData: UserLearningData | null;
}

const CourseAssessmentTab: React.FC<CourseAssessmentTabProps> = ({
  courses,
  calculateCourseProgress,
  userLearningData
}) => {
  const [selectedAssessment, setSelectedAssessment] = useState<Course | null>(null);

  const getCourseAssessmentStatus = (courseId: string) => {
    if (!userLearningData?.course_progress_new) return 'not_started';
    
    const courseProgressData = userLearningData.course_progress_new[courseId];
    if (!courseProgressData) return 'not_started';
    
    if (courseProgressData.assessment_passed) return 'passed';
    if (courseProgressData.assessment_attempted) return 'failed';
    
    return 'not_started';
  };

  const getAssessmentScore = (courseId: string): number | null => {
    if (!userLearningData?.course_progress_new) return null;
    
    const courseProgressData = userLearningData.course_progress_new[courseId];
    return courseProgressData?.assessment_score || null;
  };

  const handleAssessmentComplete = (courseId: string, passed: boolean, score: number) => {
    console.log('Assessment completed:', { courseId, passed, score });
    setSelectedAssessment(null);
    // Force refresh user data to show new certificates and updated assessment status
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Get completed courses and user skills for job recommendations
  const completedCourses = courses.filter(course => {
    const progress = calculateCourseProgress(course.id);
    const status = getCourseAssessmentStatus(course.id);
    return progress >= 100 && status === 'passed';
  });

  const userSkills = completedCourses.length > 0 
    ? ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Node.js', 'Frontend Development'] 
    : ['Web Development', 'Programming'];

  if (selectedAssessment) {
    return (
      <CourseAssessment
        courseId={selectedAssessment.id}
        courseName={selectedAssessment.name}
        isUnlocked={calculateCourseProgress(selectedAssessment.id) >= 100}
        onComplete={(passed, score) => handleAssessmentComplete(selectedAssessment.id, passed, score)}
        onClose={() => setSelectedAssessment(null)}
      />
    );
  }

  return (
    <Tabs defaultValue="assessments" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="assessments">Assessments</TabsTrigger>
        <TabsTrigger value="jobs" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Job Opportunities
        </TabsTrigger>
      </TabsList>

      <TabsContent value="assessments" className="space-y-8">
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Award className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-gray-900">Course Assessments</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
            Test your knowledge and earn professional certificates. Each assessment becomes available 
            after completing 100% of the course content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = calculateCourseProgress(course.id);
            const isUnlocked = progress >= 100;
            const assessmentStatus = getCourseAssessmentStatus(course.id);
            const assessmentScore = getAssessmentScore(course.id);

            return (
              <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <Target className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                          {course.name}
                        </CardTitle>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      {assessmentStatus === 'passed' && (
                        <Badge className="bg-green-100 text-green-700 border-green-200 font-medium whitespace-nowrap">
                          <Trophy className="h-3 w-3 mr-1" />
                          Passed
                        </Badge>
                      )}
                      
                      {assessmentStatus === 'failed' && (
                        <Badge variant="destructive" className="whitespace-nowrap">
                          Try Again
                        </Badge>
                      )}
                      
                      {!isUnlocked && (
                        <Badge variant="outline" className="border-gray-300 whitespace-nowrap">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Course Progress</span>
                      <span className="font-bold text-gray-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {assessmentScore !== null && (
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Assessment Score</span>
                        </div>
                        <span className={`text-lg font-bold ${assessmentScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {assessmentScore}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span><strong>Format:</strong> Multiple choice questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span><strong>Passing Score:</strong> 70% or higher</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4" />
                      <span><strong>Certificate:</strong> {assessmentStatus === 'passed' ? 'Available for download' : 'Earned upon passing'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    {!isUnlocked ? (
                      <Button disabled className="w-full bg-gray-100 text-gray-500 cursor-not-allowed">
                        <Lock className="h-4 w-4 mr-2" />
                        Complete Course to Unlock
                      </Button>
                    ) : assessmentStatus === 'passed' ? (
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setSelectedAssessment(course)}
                          variant="outline"
                          className="w-full border-2 border-green-200 hover:bg-green-50 text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Retake Assessment
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full border-2 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            window.location.href = '/student/certificates';
                          }}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          View Certificate
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => setSelectedAssessment(course)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        {assessmentStatus === 'failed' ? 'Retake Assessment' : 'Start Assessment'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="jobs" className="space-y-6">
        <JobRecommendations 
          userSkills={userSkills}
          courseCompleted={completedCourses.map(c => c.name).join(', ')}
        />
      </TabsContent>
    </Tabs>
  );
};

export default CourseAssessmentTab;
