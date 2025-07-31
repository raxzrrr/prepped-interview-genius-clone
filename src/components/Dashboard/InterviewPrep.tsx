import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, SkipForward, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface InterviewPrepProps {
  questions?: string[];
  onComplete: (data: { 
    questions: string[], 
    answers: string[], 
    evaluations: any[],
    facialAnalysis: any[],
    interviewId?: string 
  }) => void;
  resumeAnalysis?: any;
  interviewType?: 'basic_hr_technical' | 'role_based' | 'resume_based';
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ 
  questions: initialQuestions = [], 
  onComplete, 
  resumeAnalysis,
  interviewType = 'basic_hr_technical'
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    if (initialQuestions.length > 0) {
      setInterviewQuestions(initialQuestions);
    }
  }, [initialQuestions]);

  const handleStartRecording = () => {
    setIsRecording(true);
    setCurrentAnswer('');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In a real implementation, this would process audio input
    // For now, we'll simulate with text input
    const simulatedAnswer = currentAnswer || `Recorded answer for: ${interviewQuestions[currentQuestionIndex]}`;
    setCurrentAnswer(simulatedAnswer);
  };

  const handleNextQuestion = () => {
    const answer = currentAnswer || 'No answer provided';
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      // Interview completed - pass answers to parent for bulk evaluation
      onComplete({
        questions: interviewQuestions,
        answers: newAnswers,
        evaluations: [], // Will be populated by bulk evaluation
        facialAnalysis: [], // Placeholder for future facial analysis
        interviewId: `interview_${Date.now()}`
      });
    }
  };

  const handleSkipQuestion = () => {
    setCurrentAnswer('Question skipped');
    handleNextQuestion();
  };

  const progress = ((currentQuestionIndex + 1) / interviewQuestions.length) * 100;

  const getInterviewTypeLabel = () => {
    switch (interviewType) {
      case 'basic_hr_technical':
        return 'HR + Technical Interview';
      case 'role_based':
        return 'Role-Based Interview';
      case 'resume_based':
        return 'Resume-Based Interview';
      default:
        return 'Interview Practice';
    }
  };

  const getInterviewTypeDescription = () => {
    switch (interviewType) {
      case 'basic_hr_technical':
        return 'Combination of behavioral and basic technical questions';
      case 'role_based':
        return 'Field-specific technical and industry questions';
      case 'resume_based':
        return 'Personalized questions based on your resume';
      default:
        return 'Practice interview session';
    }
  };

  if (interviewQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium text-gray-600">No questions available</p>
        <p className="text-sm text-gray-500 mt-2">Please try again or contact support.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{getInterviewTypeLabel()}</h1>
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of {interviewQuestions.length}
          </p>
        </div>
        <Badge variant="outline">
          {getInterviewTypeDescription()}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {interviewQuestions[currentQuestionIndex]}
          </CardTitle>
          <CardDescription>
            Take your time to think about your response. You can record your answer or type it below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className="flex items-center space-x-2"
            >
              {isRecording ? (
                <>
                  <MicOff className="h-5 w-5" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  <span>Start Recording</span>
                </>
              )}
            </Button>
          </div>

          {isRecording && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-red-600">
                <div className="animate-pulse w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Recording in progress...</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Or type your answer:</label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-3 border rounded-lg min-h-[120px] resize-none"
              disabled={isRecording}
            />
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleSkipQuestion}
              className="flex items-center space-x-2"
            >
              <SkipForward className="h-4 w-4" />
              <span>Skip Question</span>
            </Button>

            <Button
              onClick={handleNextQuestion}
              className="flex items-center space-x-2"
            >
              {currentQuestionIndex === interviewQuestions.length - 1 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <SkipForward className="h-4 w-4" />
              )}
              <span>
                {currentQuestionIndex === interviewQuestions.length - 1 
                  ? 'Complete Interview' 
                  : 'Next Question'
                }
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {resumeAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resume Context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Suggested Role:</span> {resumeAnalysis.suggested_role}
              </div>
              <div>
                <span className="font-medium">Key Skills:</span> {resumeAnalysis.skills?.slice(0, 3).join(', ')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Interview Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Take your time to think through each question</li>
          <li>• Use the STAR method for behavioral questions (Situation, Task, Action, Result)</li>
          <li>• Provide specific examples from your experience</li>
          <li>• Be honest and authentic in your responses</li>
        </ul>
      </div>
    </div>
  );
};

export default InterviewPrep;