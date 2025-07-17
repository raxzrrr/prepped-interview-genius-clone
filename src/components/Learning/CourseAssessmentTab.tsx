
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Lock, CheckCircle, BookOpen } from 'lucide-react';
import { Course } from '@/services/courseService';
import { UserLearningData } from '@/services/learningService';
import CourseAssessment from './CourseAssessment';

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
    setSelectedAssessment(null);
    // The assessment completion is handled in CourseAssessment component
  };

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
    <div className="space-y-6">
      <div className="text-center py-8">
        <Award className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Course Assessments</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Complete course assessments to test your knowledge and earn certificates. 
          Each assessment requires completing 100% of the course content first.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const progress = calculateCourseProgress(course.id);
          const isUnlocked = progress >= 100;
          const assessmentStatus = getCourseAssessmentStatus(course.id);
          const assessmentScore = getAssessmentScore(course.id);

          return (
            <Card key={course.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {course.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                  </div>
                  
                  {assessmentStatus === 'passed' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Passed
                    </Badge>
                  )}
                  
                  {assessmentStatus === 'failed' && (
                    <Badge variant="destructive">
                      Failed
                    </Badge>
                  )}
                  
                  {!isUnlocked && (
                    <Badge variant="outline" className="border-gray-300">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Course Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {assessmentScore !== null && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Assessment Score</span>
                      <span className={`font-bold ${assessmentScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {assessmentScore}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Assessment Format:</strong> 20 questions (10 easy, 10 hard)
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Passing Score:</strong> 70% or higher
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Certificate:</strong> {assessmentStatus === 'passed' ? 'Available for download' : 'Earned upon passing'}
                  </p>
                </div>

                <div className="pt-2">
                  {!isUnlocked ? (
                    <Button disabled className="w-full">
                      <Lock className="h-4 w-4 mr-2" />
                      Complete Course to Unlock
                    </Button>
                  ) : assessmentStatus === 'passed' ? (
                    <div className="space-y-2">
                      <Button disabled className="w-full" variant="outline">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Assessment Completed
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          // Navigate to certificates page
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
                      className="w-full"
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
    </div>
  );
};

export default CourseAssessmentTab;
