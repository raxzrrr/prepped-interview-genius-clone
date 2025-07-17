
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Clock, Users, Star, Award, Lock, CheckCircle } from 'lucide-react';
import { Course } from '@/services/courseService';
import CourseAssessment from './CourseAssessment';

interface CourseCardProps {
  course: Course;
  progress: number;
  videoCount: number;
  onStartCourse: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  progress, 
  videoCount, 
  onStartCourse 
}) => {
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentPassed, setAssessmentPassed] = useState(false);
  
  const isCompleted = progress >= 100;
  const canTakeAssessment = isCompleted && !assessmentPassed;

  const handleAssessmentComplete = (passed: boolean, score: number) => {
    if (passed) {
      setAssessmentPassed(true);
    }
    setShowAssessment(false);
  };

  if (showAssessment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <CourseAssessment
            courseId={course.id}
            courseName={course.name}
            isUnlocked={isCompleted}
            onComplete={handleAssessmentComplete}
            onClose={() => setShowAssessment(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-brand-purple">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-brand-purple transition-colors">
              {course.name}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {course.description}
            </CardDescription>
          </div>
          {assessmentPassed && (
            <Award className="h-6 w-6 text-yellow-500 flex-shrink-0 ml-2" />
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
          <div className="flex items-center">
            <Play className="h-4 w-4 mr-1" />
            {videoCount} videos
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            ~2h duration
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            1.2k students
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-600 ml-1">4.2</span>
              </div>
              
              {isCompleted && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => onStartCourse(course.id)}
                size="sm"
                variant={progress > 0 ? "default" : "outline"}
              >
                {progress > 0 ? 'Continue' : 'Start Course'}
              </Button>
              
              {canTakeAssessment && (
                <Button
                  onClick={() => setShowAssessment(true)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Award className="h-4 w-4 mr-1" />
                  Take Assessment
                </Button>
              )}
              
              {!isCompleted && progress > 0 && (
                <Button
                  onClick={() => setShowAssessment(true)}
                  size="sm"
                  variant="outline"
                  disabled
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Assessment
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
