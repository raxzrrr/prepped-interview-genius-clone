
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, SkipForward, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';
import { useAuth } from '@/contexts/ClerkAuthContext';
import voiceToTextService from '@/services/voiceToTextService';
import ttsService from '@/services/ttsService';
import InterviewReport from './InterviewReport';
import ResumeAnalysisResults from './ResumeAnalysisResults';

interface InterviewPrepProps {
  questions: string[];
  onComplete: (data: { questions: string[], answers: string[], facialAnalysis: any[], interviewId?: string }) => void;
  resumeAnalysis?: any;
  interviewId?: string;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ 
  questions, 
  onComplete, 
  resumeAnalysis,
  interviewId 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [facialAnalysis, setFacialAnalysis] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [actualInterviewId, setActualInterviewId] = useState<string | undefined>(interviewId);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { getAnswerFeedback, analyzeFacialExpression, saveInterview, updateInterview } = useInterviewApi();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (questions.length > 0) {
      initializeCamera();
      if (audioEnabled) {
        speakQuestion(questions[0]);
      }
    }
    return () => cleanup();
  }, [questions, audioEnabled]);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    ttsService.stop();
    voiceToTextService.stop();
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      }
      
      // Start facial analysis every 10 seconds
      intervalRef.current = setInterval(() => {
        if (currentQuestionIndex < questions.length) {
          captureFacialExpression();
        }
      }, 10000);
      
    } catch (error) {
      console.error('Camera access denied:', error);
      toast({
        title: "Camera Access",
        description: "Camera access was denied. Facial analysis will be disabled.",
        variant: "destructive",
      });
    }
  };

  const captureFacialExpression = async () => {
    if (!videoRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      context.drawImage(videoRef.current, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg');
      
      const analysis = await analyzeFacialExpression(imageBase64);
      
      if (analysis) {
        setFacialAnalysis(prev => [...prev, analysis]);
      }
    } catch (error) {
      console.error('Facial analysis error:', error);
    }
  };

  const speakQuestion = async (question: string) => {
    if (!audioEnabled) return;
    
    try {
      setIsPlaying(true);
      await ttsService.speak(question);
    } catch (error) {
      console.error('TTS Error:', error);
      toast({
        title: "Text-to-Speech Error",
        description: "Audio playback failed. You can still read the question.",
        variant: "destructive",
      });
    } finally {
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setCurrentAnswer('');
      
      await voiceToTextService.start((text) => {
        setCurrentAnswer(text);
      });
      
      toast({
        title: "Recording Started",
        description: "Speak your answer now...",
      });
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await voiceToTextService.stop();
      
      if (currentAnswer.trim()) {
        // Update the answers array with the current answer
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = currentAnswer.trim();
        setAnswers(newAnswers);
        
        toast({
          title: "Answer Recorded",
          description: "Your answer has been saved.",
        });
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast({
        title: "Recording Error",
        description: "Failed to stop recording.",
        variant: "destructive",
      });
    }
  };

  const nextQuestion = () => {
    // Save current answer if there is one
    if (currentAnswer.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer.trim();
      setAnswers(newAnswers);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentAnswer('');
      
      if (audioEnabled) {
        speakQuestion(questions[nextIndex]);
      }
    }
  };

  const skipQuestion = () => {
    // Mark as skipped but don't overwrite if there's already an answer
    const newAnswers = [...answers];
    if (!newAnswers[currentQuestionIndex] || newAnswers[currentQuestionIndex].trim() === '') {
      newAnswers[currentQuestionIndex] = 'Question skipped';
    }
    setAnswers(newAnswers);
    nextQuestion();
  };

  const finishInterview = async () => {
    try {
      // Save the current answer if there is one
      const finalAnswers = [...answers];
      if (currentAnswer.trim()) {
        finalAnswers[currentQuestionIndex] = currentAnswer.trim();
      } else if (!finalAnswers[currentQuestionIndex] || finalAnswers[currentQuestionIndex].trim() === '') {
        finalAnswers[currentQuestionIndex] = 'No answer provided';
      }
      
      setAnswers(finalAnswers);
      
      // Calculate a basic score
      const validAnswers = finalAnswers.filter(answer => 
        answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped'
      );
      const score = Math.round((validAnswers.length / questions.length) * 100);
      
      // Save or update the interview
      if (actualInterviewId) {
        await updateInterview(actualInterviewId, {
          status: 'completed',
          answers: finalAnswers,
          score: score,
          facial_analysis: facialAnalysis,
          completed_at: new Date().toISOString()
        });
      } else if (user) {
        const newInterviewData = {
          user_id: user.id,
          title: `Interview - ${new Date().toLocaleDateString()}`,
          questions: questions,
          answers: finalAnswers,
          status: 'completed',
          score: score,
          facial_analysis: facialAnalysis,
          completed_at: new Date().toISOString()
        };
        
        const newInterviewId = await saveInterview(newInterviewData);
        setActualInterviewId(newInterviewId);
      }
      
      cleanup();
      setIsComplete(true);
      
      // Call onComplete with the final data
      onComplete({
        questions,
        answers: finalAnswers,
        facialAnalysis,
        interviewId: actualInterviewId
      });
      
    } catch (error) {
      console.error('Error finishing interview:', error);
      toast({
        title: "Save Error",
        description: "Failed to save interview. You can still view your results.",
        variant: "destructive",
      });
      
      // Even if save fails, show the results
      const finalAnswers = [...answers];
      if (currentAnswer.trim()) {
        finalAnswers[currentQuestionIndex] = currentAnswer.trim();
      }
      
      cleanup();
      setIsComplete(true);
      onComplete({
        questions,
        answers: finalAnswers,
        facialAnalysis,
        interviewId: actualInterviewId
      });
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
    }
  };

  const replayQuestion = () => {
    if (audioEnabled && questions[currentQuestionIndex]) {
      speakQuestion(questions[currentQuestionIndex]);
    }
  };

  if (isComplete) {
    return (
      <InterviewReport
        questions={questions}
        answers={answers}
        facialAnalysis={facialAnalysis}
        interviewId={actualInterviewId}
        onDone={() => {
          setIsComplete(false);
          setCurrentQuestionIndex(0);
          setAnswers(new Array(questions.length).fill(''));
          setCurrentAnswer('');
          setFacialAnalysis([]);
        }}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No questions available</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {resumeAnalysis && (
        <ResumeAnalysisResults analysis={resumeAnalysis} />
      )}
      
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interview Progress</CardTitle>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Video Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Video Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-full h-64 bg-gray-100 rounded-lg object-cover"
            />
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAudio}
                className="flex items-center"
              >
                {audioEnabled ? (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Audio On
                  </>
                ) : (
                  <>
                    <VolumeX className="mr-2 h-4 w-4" />
                    Audio Off
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Question</CardTitle>
            <div className="flex space-x-2">
              {audioEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={replayQuestion}
                  disabled={isPlaying}
                  className="flex items-center"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Replay
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg font-medium">{currentQuestion}</p>
            
            {/* Recording Controls */}
            <div className="flex items-center space-x-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                className="flex items-center"
              >
                {isRecording ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </>
                )}
              </Button>
              
              {isRecording && (
                <div className="flex items-center text-red-500">
                  <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Recording...
                </div>
              )}
            </div>
            
            {/* Current Answer Display */}
            {(currentAnswer || answers[currentQuestionIndex]) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                <p className="text-gray-700">
                  {currentAnswer || answers[currentQuestionIndex] || 'No answer provided'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={skipQuestion}
              className="flex items-center"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Question
            </Button>
            
            <div className="flex space-x-3">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={nextQuestion}
                  className="flex items-center"
                >
                  Next Question
                  <SkipForward className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={finishInterview}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finish Interview
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewPrep;
