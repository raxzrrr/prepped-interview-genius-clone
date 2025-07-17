
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Play, 
  Square, 
  SkipForward,
  Clock,
  User,
  Zap,
  Gift
} from 'lucide-react';
import { useInterviewApi } from '@/services/api';
import { useSubscription } from '@/hooks/useSubscription';
import { useInterviewUsage } from '@/hooks/useInterviewUsage';
import { useToast } from '@/hooks/use-toast';

interface InterviewQuestion {
  id?: string;
  question: string;
}

interface InterviewPrepProps {
  questions?: string[];
  onComplete?: (data: { 
    questions: string[], 
    answers: string[], 
    evaluations: any[],
    facialAnalysis: any[],
    interviewId?: string 
  }) => void;
  resumeAnalysis?: any;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ 
  questions: propQuestions = [], 
  onComplete,
  resumeAnalysis 
}) => {
  const [jobRole, setJobRole] = useState('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const { generateInterviewQuestions } = useInterviewApi();
  const { hasProPlan } = useSubscription();
  const { canUseFreeInterview, markFreeInterviewUsed } = useInterviewUsage();
  const { toast } = useToast();

  const isPro = hasProPlan();
  const canStartInterview = isPro || canUseFreeInterview();

  // Initialize with prop questions if provided
  useEffect(() => {
    if (propQuestions.length > 0) {
      const formattedQuestions = propQuestions.map((q, index) => ({
        id: `q-${index}`,
        question: q
      }));
      setQuestions(formattedQuestions);
      setIsInterviewStarted(true);
      setSessionStartTime(new Date());
    }
  }, [propQuestions]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const getCameraStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    if (isVideoOn) {
      getCameraStream();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isVideoOn]);

  const startInterview = async () => {
    if (!jobRole.trim()) {
      toast({
        title: "Job Role Required",
        description: "Please enter a job role to generate interview questions.",
        variant: "destructive"
      });
      return;
    }

    if (!canStartInterview) {
      toast({
        title: "Upgrade Required",
        description: "You've used your free interview. Upgrade to Pro for unlimited access.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const generatedQuestions = await generateInterviewQuestions(jobRole);
      
      if (generatedQuestions.length > 0) {
        const formattedQuestions = generatedQuestions.map((q: any, index: number) => ({
          id: `generated-${index}`,
          question: typeof q === 'string' ? q : q.question
        }));
        setQuestions(formattedQuestions);
        setCurrentQuestionIndex(0);
        setIsInterviewStarted(true);
        setSessionStartTime(new Date());
        
        // Mark free interview as used if not pro
        if (!isPro && canUseFreeInterview()) {
          await markFreeInterviewUsed();
        }

        toast({
          title: "Interview Started",
          description: `Generated ${formattedQuestions.length} questions for ${jobRole}`,
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextQuestion = () => {
    // Save current answer
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      finishInterview();
    }
  };

  const finishInterview = () => {
    const finalAnswers = [...answers];
    finalAnswers[currentQuestionIndex] = currentAnswer;
    
    if (onComplete) {
      onComplete({
        questions: questions.map(q => q.question),
        answers: finalAnswers,
        evaluations: [],
        facialAnalysis: [],
        interviewId: `interview-${Date.now()}`
      });
    } else {
      setIsInterviewStarted(false);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setCurrentAnswer('');
      setAnswers([]);
      setSessionStartTime(null);
      
      toast({
        title: "Interview Completed",
        description: "Great job! Your interview session has been completed.",
      });
    }
  };

  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Interview Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                AI Interview Practice
              </CardTitle>
              <CardDescription>
                Practice with AI-powered mock interviews
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isPro && (
                <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  {canUseFreeInterview() ? (
                    <>
                      <Gift className="w-3 h-3 mr-1" />
                      Free Trial
                    </>
                  ) : (
                    'Trial Used'
                  )}
                </Badge>
              )}
              {isPro && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <Zap className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {!isInterviewStarted ? (
        /* Interview Setup */
        <Card>
          <CardHeader>
            <CardTitle>Start Your Interview</CardTitle>
            <CardDescription>
              {canStartInterview 
                ? "Enter the job role you're preparing for to generate relevant questions"
                : "You've used your free interview. Upgrade to Pro for unlimited access."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="jobRole" className="text-sm font-medium">
                Job Role
              </label>
              <Input
                id="jobRole"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                disabled={!canStartInterview}
              />
            </div>
            
            <Button 
              onClick={startInterview} 
              disabled={isLoading || !canStartInterview || !jobRole.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {canStartInterview ? 'Start Interview' : 'Upgrade to Continue'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Active Interview */
        <div className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Current Question */}
          {questions[currentQuestionIndex] && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Interview Question
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-lg font-medium text-blue-900">
                    {questions[currentQuestionIndex].question}
                  </p>
                </div>

                {/* Video Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      {isVideoOn ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center">
                          <Video className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">Camera is off</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Camera Controls */}
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsVideoOn(!isVideoOn)}
                      >
                        {isVideoOn ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRecording(!isRecording)}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Answer Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Your Answer</label>
                      <Textarea
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer here or use voice recording..."
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Question Controls */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={finishInterview}>
                    <Square className="h-4 w-4 mr-2" />
                    End Interview
                  </Button>
                  <Button onClick={nextQuestion}>
                    {currentQuestionIndex < questions.length - 1 ? (
                      <>
                        <SkipForward className="h-4 w-4 mr-2" />
                        Next Question
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Finish Interview
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;
