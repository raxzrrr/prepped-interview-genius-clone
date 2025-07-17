
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Play, Pause, SkipForward, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';

interface InterviewQuestion {
  id?: string;
  question: string;
}

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
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ 
  questions: initialQuestions = [], 
  onComplete, 
  resumeAnalysis 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const { toast } = useToast();
  const { generateInterviewQuestions, evaluateAnswer } = useInterviewApi();

  useEffect(() => {
    if (initialQuestions.length > 0) {
      setInterviewQuestions(initialQuestions);
    } else {
      generateDynamicQuestions();
    }
  }, [initialQuestions]);

  const generateDynamicQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const role = resumeAnalysis?.suggested_role || 'Software Developer';
      const generatedQuestions = await generateInterviewQuestions(role);
      
      if (generatedQuestions && generatedQuestions.length > 0) {
        const questions = generatedQuestions.map(q => 
          typeof q === 'string' ? q : q.question
        );
        setInterviewQuestions(questions);
        toast({
          title: "Questions Generated",
          description: `Generated ${questions.length} interview questions`,
        });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Generation Failed",
        description: "Using fallback questions. Please check your API key settings.",
        variant: "destructive"
      });
      
      // Fallback questions
      setInterviewQuestions([
        "Tell me about yourself and your background.",
        "What are your greatest strengths?",
        "Describe a challenging project you worked on.",
        "Where do you see yourself in 5 years?",
        "Why are you interested in this role?"
      ]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setCurrentAnswer('');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // In a real implementation, this would process audio input
    // For now, we'll simulate with text input
    const simulatedAnswer = currentAnswer || `Answer for: ${interviewQuestions[currentQuestionIndex]}`;
    setCurrentAnswer(simulatedAnswer);
  };

  const handleNextQuestion = async () => {
    const answer = currentAnswer || 'No answer provided';
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Get AI evaluation for the current answer
    setIsEvaluating(true);
    try {
      const evaluation = await evaluateAnswer(
        interviewQuestions[currentQuestionIndex], 
        answer
      );
      
      const newEvaluations = [...evaluations, evaluation];
      setEvaluations(newEvaluations);
      
      if (evaluation) {
        toast({
          title: "Answer Evaluated",
          description: `Score: ${evaluation.score_breakdown?.overall || 'N/A'}/10`,
        });
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      // Continue without evaluation
      setEvaluations([...evaluations, null]);
    } finally {
      setIsEvaluating(false);
    }

    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      // Interview completed
      onComplete({
        questions: interviewQuestions,
        answers: newAnswers,
        evaluations: [...evaluations, evaluations[evaluations.length - 1]],
        facialAnalysis: [], // Placeholder for future facial analysis
        interviewId: `interview_${Date.now()}`
      });
    }
  };

  const handleSkipQuestion = () => {
    handleNextQuestion();
  };

  const progress = ((currentQuestionIndex + 1) / interviewQuestions.length) * 100;

  if (isGeneratingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mx-auto mb-4"></div>
          <p className="text-lg font-medium">Generating personalized interview questions...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (interviewQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-medium text-gray-600">No questions available</p>
        <Button onClick={generateDynamicQuestions} className="mt-4">
          Generate Questions
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interview Practice</h1>
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of {interviewQuestions.length}
          </p>
        </div>
        <Badge variant="outline">
          AI-Generated Questions
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
              className="w-full p-3 border rounded-lg min-h-[100px] resize-none"
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
              disabled={isEvaluating}
              className="flex items-center space-x-2"
            >
              {isEvaluating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : currentQuestionIndex === interviewQuestions.length - 1 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <SkipForward className="h-4 w-4" />
              )}
              <span>
                {isEvaluating 
                  ? 'Evaluating...' 
                  : currentQuestionIndex === interviewQuestions.length - 1 
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
    </div>
  );
};

export default InterviewPrep;
