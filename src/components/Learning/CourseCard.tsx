
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Clock, Users, Star, CheckCircle, BookOpen } from 'lucide-react';
import { Course } from '@/services/courseService';

interface CourseCardProps {
  course: Course;
  progress: number;
  videoCount: number;
  onStartCourse: (courseId: string) => void;
  showAssessmentButton?: boolean;
}

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  progress, 
  videoCount, 
  onStartCourse,
  showAssessmentButton = false
}) => {
  const isCompleted = progress >= 100;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {course.name}
              </CardTitle>
            </div>
          </div>
          {isCompleted && (
            <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Badge>
          )}
        </div>
        
        <CardDescription className="text-gray-600 line-clamp-2 leading-relaxed">
          {course.description}
        </CardDescription>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
          <div className="flex items-center gap-1">
            <Play className="h-4 w-4" />
            <span>{videoCount} videos</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>~2h duration</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>1.2k students</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-gray-900">{Math.round(progress)}%</span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2.5 bg-gray-100" />
            <div 
              className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-1">4.2 (127 reviews)</span>
          </div>
        </div>
        
        <Button
          onClick={() => onStartCourse(course.id)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {progress > 0 ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Continue Learning
            </>
          ) : (
            <>
              <BookOpen className="h-4 w-4 mr-2" />
              Start Course
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CourseCard;
