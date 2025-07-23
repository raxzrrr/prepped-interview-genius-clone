
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
  const [expectedAnswers, setExpectedAnswers] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const { toast } = useToast();
  const { generateInterviewQuestions, evaluateInterviewSession } = useInterviewApi();

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
      const questionData = await generateInterviewQuestions(role);
      
      if (questionData && questionData.questions && questionData.expectedAnswers) {
        setInterviewQuestions(questionData.questions);
        setExpectedAnswers(questionData.expectedAnswers);
        toast({
          title: "Professional Questions Generated",
          description: `Generated ${questionData.questions.length} industry-standard interview questions`,
        });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Generation Failed",
        description: "Using fallback questions. Please check your API key settings.",
        variant: "destructive"
      });
      
      // Professional fallback questions
      const fallbackQuestions = [
        "Describe a time you had to debug a complex technical issue in a large codebase. Walk me through your process.",
        "Tell me about a project where you had to collaborate with difficult stakeholders. How did you handle conflicts?",
        "Explain how you would design a scalable system to handle 1 million users.",
        "Describe a situation where you had to learn a new technology quickly for a project.",
        "Walk me through how you would optimize the performance of a slow-loading web application.",
        "Tell me about a time you made a significant mistake in your work. How did you handle it?",
        "How do you stay current with new technologies and industry trends in your field?",
        "Describe your experience with code reviews. How do you give and receive feedback effectively?",
        "Explain a complex technical concept to me as if I were a non-technical stakeholder.",
        "What motivates you in your work, and how do you handle challenging or repetitive tasks?"
      ];
      
      const fallbackExpected = [
        "Should include systematic debugging approach, use of tools, understanding of architecture, and preventive measures.",
        "Should demonstrate conflict resolution, clear communication, empathy, and measurable outcomes.",
        "Must cover database scaling, load balancing, caching, CDN, microservices, and monitoring.",
        "Should include structured learning approach, resource identification, practice methodology, and examples.",
        "Must demonstrate monitoring tools, bottleneck identification, optimization techniques, and results.",
        "Should show responsibility, damage control, transparent communication, and learning from mistakes.",
        "Must include industry engagement, continuous learning, and professional development commitment.",
        "Should demonstrate constructive feedback, professional growth mindset, and collaborative improvement.",
        "Must show clear communication, audience understanding, analogies, and business value focus.",
        "Should include specific motivation factors, engagement strategies, and professional alignment."
      ];
      
      setInterviewQuestions(fallbackQuestions);
      setExpectedAnswers(fallbackExpected);
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

    if (currentQuestionIndex < interviewQuestions.length - 1) {
      // Move to next question without evaluation
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
      
      toast({
        title: "Answer Saved",
        description: `Question ${currentQuestionIndex + 1} answered. ${interviewQuestions.length - currentQuestionIndex - 1} questions remaining.`,
      });
    } else {
      // All questions answered - now perform batch evaluation
      setIsEvaluating(true);
      
      try {
        toast({
          title: "Interview Complete",
          description: "Performing professional evaluation of all answers...",
        });
        
        const batchEvaluation = await evaluateInterviewSession(
          interviewQuestions,
          newAnswers,
          expectedAnswers
        );
        
        // Complete the interview with batch evaluation
        onComplete({
          questions: interviewQuestions,
          answers: newAnswers,
          evaluations: [batchEvaluation], // Single comprehensive evaluation
          facialAnalysis: [], // Placeholder for future facial analysis
          interviewId: `interview_${Date.now()}`
        });
        
      } catch (error) {
        console.error('Error evaluating interview session:', error);
        toast({
          title: "Evaluation Error",
          description: "Completing interview without AI evaluation",
          variant: "destructive"
        });
        
        // Complete without evaluation
        onComplete({
          questions: interviewQuestions,
          answers: newAnswers,
          evaluations: [],
          facialAnalysis: [],
          interviewId: `interview_${Date.now()}`
        });
      } finally {
        setIsEvaluating(false);
      }
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
          <p className="text-lg font-medium">Generating 10 professional interview questions...</p>
          <p className="text-sm text-gray-500 mt-2">Creating industry-standard questions with expected answers</p>
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
          <h1 className="text-2xl font-bold">Professional Interview Practice</h1>
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of {interviewQuestions.length} • Industry Standard Questions
          </p>
        </div>
        <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
          Strict Evaluation Mode
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
            This is a professional-level question. Answer thoroughly with specific examples. All answers will be evaluated strictly against industry standards.
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
                  ? 'Performing Strict Evaluation...' 
                  : currentQuestionIndex === interviewQuestions.length - 1 
                    ? 'Complete & Evaluate Interview' 
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
