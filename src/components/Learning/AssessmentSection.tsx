
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Check, CheckCircle, Lock, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface UserLearningData {
  assessment_completed_at: string | null;
  assessment_attempted: boolean;
  assessment_score: number | null;
}

interface AssessmentSectionProps {
  courses: Course[];
  userLearningData: UserLearningData | null;
  onModuleSelect: (module: Module) => void;
  onMarkAsCompleted: (moduleId: string, event: React.MouseEvent) => void;
}

const AssessmentSection: React.FC<AssessmentSectionProps> = ({
  courses,
  userLearningData,
  onModuleSelect,
  onMarkAsCompleted
}) => {
  const { toast } = useToast();

  const interviewMasteryCourse = courses.find(c => c.id === 'interview-mastery');
  const assessmentCourse = courses.find(c => c.id === 'assessment');
  const isInterviewCourseComplete = interviewMasteryCourse?.progress === 100;

  const handleAssessmentClick = (moduleId: string) => {
    if (moduleId === 'assessment-test' && !isInterviewCourseComplete) {
      toast({
        title: "Assessment Locked",
        description: "Complete the Interview Mastery Course to unlock the assessment.",
        variant: "destructive"
      });
      return;
    }

    const module = assessmentCourse?.modules.find(m => m.id === moduleId);
    if (module) {
      onModuleSelect(module);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Technical Assessment</CardTitle>
            <p className="mt-1 text-gray-600">
              Test your technical interview skills and earn a certificate
            </p>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
            </svg>
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
               onClick={() => handleAssessmentClick('assessment-intro')}
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
            <div className="ml-auto">
              <Button 
                variant={assessmentCourse?.modules.find(m => m.id === 'assessment-intro')?.completed ? "outline" : "default"}
                size="sm"
                className={assessmentCourse?.modules.find(m => m.id === 'assessment-intro')?.completed ? 
                  'bg-green-50 text-green-600 border-green-200' : 'bg-brand-purple hover:bg-brand-purple/90'}
                onClick={(e) => onMarkAsCompleted('assessment-intro', e)}
                disabled={assessmentCourse?.modules.find(m => m.id === 'assessment-intro')?.completed}
              >
                <Check className="h-4 w-4 mr-1" />
                {assessmentCourse?.modules.find(m => m.id === 'assessment-intro')?.completed ? 'Completed' : 'Mark Complete'}
              </Button>
            </div>
          </div>
          
          <div className={`flex items-start p-3 border rounded-lg ${
            userLearningData?.assessment_completed_at
              ? 'border-green-200 bg-green-50'
              : isInterviewCourseComplete
                ? 'cursor-pointer hover:bg-brand-purple/5 hover:border-brand-purple/50'
                : 'opacity-75 bg-gray-50'
          }`}
               onClick={() => handleAssessmentClick('assessment-test')}
          >
            <div className="mr-4 mt-1">
              {userLearningData?.assessment_completed_at ? (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-500">
                  <Check className="h-5 w-5" />
                </div>
              ) : isInterviewCourseComplete ? (
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
                <h4 className={`font-medium ${!isInterviewCourseComplete && !userLearningData?.assessment_completed_at ? 'text-gray-500' : ''}`}>
                  Technical Assessment Test
                </h4>
                <span className="text-sm text-gray-500">30 min</span>
              </div>
              <p className={`text-sm mt-1 ${!isInterviewCourseComplete && !userLearningData?.assessment_completed_at ? 'text-gray-400' : 'text-gray-600'}`}>
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
            {isInterviewCourseComplete && (
              <div className="ml-auto">
                <Button 
                  variant={assessmentCourse?.modules.find(m => m.id === 'assessment-test')?.completed ? "outline" : "default"}
                  size="sm"
                  className={assessmentCourse?.modules.find(m => m.id === 'assessment-test')?.completed ? 
                    'bg-green-50 text-green-600 border-green-200' : 'bg-brand-purple hover:bg-brand-purple/90'}
                  onClick={(e) => onMarkAsCompleted('assessment-test', e)}
                  disabled={assessmentCourse?.modules.find(m => m.id === 'assessment-test')?.completed}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {assessmentCourse?.modules.find(m => m.id === 'assessment-test')?.completed ? 'Completed' : 'Mark Complete'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {userLearningData?.assessment_completed_at && (userLearningData?.assessment_score || 0) >= 80 ? (
          <Button variant="outline" onClick={() => window.location.href = '/certificates'}>
            View Certificate
          </Button>
        ) : isInterviewCourseComplete ? (
          <Button onClick={() => handleAssessmentClick('assessment-test')}>
            Start Assessment
          </Button>
        ) : (
          <Button disabled>
            Complete Course to Unlock
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AssessmentSection;
