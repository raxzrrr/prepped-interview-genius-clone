
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, PlayCircle, Play } from 'lucide-react';

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

interface CourseListProps {
  courses: Course[];
  onModuleSelect: (module: Module) => void;
  onMarkAsCompleted: (moduleId: string, event: React.MouseEvent) => void;
}

const CourseList: React.FC<CourseListProps> = ({ 
  courses, 
  onModuleSelect, 
  onMarkAsCompleted 
}) => {
  return (
    <div className="space-y-6">
      {courses.map(course => {
        // Ensure progress is between 0 and 100
        const clampedProgress = Math.min(Math.max(course.progress || 0, 0), 100);
        
        return (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <p className="mt-1 text-gray-600">{course.description}</p>
                </div>
                <Badge className={clampedProgress >= 100 ? "bg-green-500" : "bg-brand-purple"}>
                  {Math.round(clampedProgress)}% Complete
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Progress value={clampedProgress} className="h-2" />
              </div>
              
              <div className="space-y-4">
                {course.modules.map((module, index) => (
                  <div key={module.id} 
                       className={`flex items-start p-3 border rounded-lg ${
                         module.completed 
                           ? 'border-green-200 bg-green-50' 
                           : 'border-gray-200 hover:border-brand-purple/50 hover:bg-brand-purple/5 cursor-pointer'
                       }`}
                  >
                    <div 
                      className="mr-4 mt-1 cursor-pointer"
                      onClick={() => onModuleSelect(module)}
                    >
                      {module.completed ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-500">
                          <Check className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple/10 text-brand-purple">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onModuleSelect(module)}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium">
                          {index + 1}. {module.title}
                        </h4>
                        <span className="text-sm text-gray-500">{module.duration}</span>
                      </div>
                      <p className="text-sm mt-1 text-gray-600">
                        {module.description}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center">
                      <Button 
                        variant={module.completed ? "outline" : "default"}
                        size="sm"
                        className={`${module.completed ? 'bg-green-50 text-green-600 border-green-200' : 'bg-brand-purple hover:bg-brand-purple/90'}`}
                        onClick={(e) => onMarkAsCompleted(module.id, e)}
                        disabled={module.completed}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {module.completed ? 'Completed' : 'Mark Complete'}
                      </Button>
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
                  disabled={!course.modules.some(m => !m.completed)}
                  onClick={() => {
                    const nextModule = course.modules.find(m => !m.completed);
                    if (nextModule) {
                      onModuleSelect(nextModule);
                    }
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Learning
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default CourseList;
