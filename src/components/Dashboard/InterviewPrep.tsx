import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { SkipForward, CheckCircle, Type } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import VoiceInput from '@/components/VoiceInput';

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
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isCompleting, setIsCompleting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (initialQuestions.length > 0) {
      setInterviewQuestions(initialQuestions);
    }
  }, [initialQuestions]);

  const handleVoiceTranscription = (transcription: string) => {
    setCurrentAnswer(transcription);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentAnswer(e.target.value);
  };

  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "Answer Required",
        description: "Please provide an answer before proceeding",
        variant: "destructive",
      });
      return;
    }

    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = currentAnswer.trim();
    setAnswers(updatedAnswers);
    setCurrentAnswer('');
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      toast({
        title: "Answer Saved",
        description: `Moving to question ${currentQuestionIndex + 2}`,
      });
    } else {
      handleCompleteInterview(updatedAnswers);
    }
  };

  const handleCompleteInterview = (finalAnswers: string[]) => {
    setIsCompleting(true);
    onComplete({
      questions: interviewQuestions,
      answers: finalAnswers,
      evaluations: [],
      facialAnalysis: [],
      interviewId: `interview_${Date.now()}`
    });
  };

  const handleSkipQuestion = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = 'Question skipped';
    setAnswers(updatedAnswers);
    setCurrentAnswer('');
    
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      toast({
        title: "Question Skipped",
        description: `Moving to question ${currentQuestionIndex + 2}`,
      });
    } else {
      handleCompleteInterview(updatedAnswers);
    }
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

  if (isCompleting) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-8 w-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold">Generating your report...</h2>
            <p className="text-gray-600">Please wait while we evaluate your answers and prepare the report.</p>
          </CardContent>
        </Card>
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
            Take your time to think about your response. You can use voice input or type your answer below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={inputMode === 'voice' ? 'default' : 'outline'}
              onClick={() => setInputMode('voice')}
              size="sm"
            >
              Voice Input
            </Button>
            <Button
              variant={inputMode === 'text' ? 'default' : 'outline'}
              onClick={() => setInputMode('text')}
              size="sm"
            >
              <Type className="h-4 w-4 mr-2" />
              Text Input
            </Button>
          </div>

          {/* Voice Input Mode */}
          {inputMode === 'voice' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <VoiceInput 
                  onTranscription={handleVoiceTranscription}
                  className="w-fit"
                />
              </div>
              {currentAnswer && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Transcribed Answer:
                  </label>
                  <Textarea
                    value={currentAnswer}
                    onChange={handleTextChange}
                    placeholder="Your transcribed answer will appear here..."
                    className="min-h-[120px] bg-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Text Input Mode */}
          {inputMode === 'text' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Type your answer:</label>
              <Textarea
                value={currentAnswer}
                onChange={handleTextChange}
                placeholder="Type your answer here..."
                className="min-h-[120px]"
              />
            </div>
          )}

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleSkipQuestion}
              className="flex items-center space-x-2"
              disabled={isCompleting}
            >
              <SkipForward className="h-4 w-4" />
              <span>Skip Question</span>
            </Button>

            <Button
              onClick={handleSubmitAnswer}
              className="flex items-center space-x-2"
              disabled={!currentAnswer.trim() || isCompleting}
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
          <li>• You can edit transcribed text before submitting your answer</li>
        </ul>
      </div>
    </div>
  );
};

export default InterviewPrep;