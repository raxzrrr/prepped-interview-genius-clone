
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';
import ttsService from '@/services/ttsService';
import { Mic, MicOff, Video, VideoOff, ArrowRight, AlertTriangle } from 'lucide-react';

interface InterviewPrepProps {
  questions: string[];
  interviewId?: string;
  onInterviewComplete: (answers: string[], facialData: any[]) => void;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ questions, interviewId, onInterviewComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [facialData, setFacialData] = useState<any[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const { getAnswerFeedback, analyzeFacialExpression, updateInterview } = useInterviewApi();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      speakQuestion();
    }
  }, [currentQuestionIndex, questions]);

  useEffect(() => {
    return () => {
      stopMediaStream();
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const speakQuestion = async () => {
    try {
      const currentQuestion = questions[currentQuestionIndex];
      setIsSpeaking(true);
      await ttsService.speak(currentQuestion);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error speaking question:', error);
      setIsSpeaking(false);
      toast({
        title: "Text-to-Speech Error",
        description: "Could not read the question aloud. Please check your TTS configuration.",
        variant: "destructive"
      });
    }
  }

  const requestMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Permission Required",
        description: "Please allow access to your camera and microphone to continue.",
        variant: "destructive",
      });
      return null;
    }
  };

  const startRecording = async () => {
    setAudioBlob(null);
    setApiError(null);
    
    const stream = mediaStream || await requestMediaPermissions();
    if (!stream) return;
    
    try {
      const audioChunks: BlobPart[] = [];
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingAudio(true);
      
      startVideoAnalysis(stream);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startVideoAnalysis = (stream: MediaStream) => {
    setIsRecordingVideo(true);
    
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      analysisIntervalRef.current = setInterval(() => {
        if (canvas && video && video.videoWidth > 0) {
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageBase64 = canvas.toDataURL('image/jpeg');
            analyzeFace(imageBase64);
          }
        }
      }, 5000);
    }
  };
  
  const lastAnalysisTime = useRef(0);
  const analyzeFace = async (imageBase64: string) => {
    const now = Date.now();
    if (now - lastAnalysisTime.current < 5000) {
      return;
    }
    
    lastAnalysisTime.current = now;
    
    try {
      const analysis = await analyzeFacialExpression(imageBase64);
      if (analysis) {
        setFacialData(prevData => [...prevData, analysis]);
      }
    } catch (error) {
      console.error('Facial analysis error:', error);
      setApiError('Facial analysis temporarily unavailable');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    setIsRecordingVideo(false);
  };

  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  };
  
  const handleSkipQuestion = () => {
    ttsService.stop();
    setIsSpeaking(false);
    setAnswers(prev => [...prev, "Question skipped"]);
    moveToNextQuestion();
  };

  const handleNextQuestion = async () => {
    if (isRecordingAudio) {
      stopRecording();
    }

    const currentAnswer = audioBlob ? "Audio answer recorded" : "No answer provided";
    const updatedAnswers = [...answers, currentAnswer];
    setAnswers(updatedAnswers);
    
    if (interviewId) {
      try {
        await updateInterview(interviewId, {
          answers: updatedAnswers,
          current_question: currentQuestionIndex + 1
        });
      } catch (error) {
        console.error('Error updating interview:', error);
      }
    }
    
    // Try to get feedback, but don't block progression if it fails
    try {
      await getAnswerFeedback(questions[currentQuestionIndex], currentAnswer);
    } catch (error) {
      console.error('Error getting feedback:', error);
      setApiError('Answer feedback temporarily unavailable');
    }
    
    moveToNextQuestion();
  };
  
  const moveToNextQuestion = () => {
    ttsService.stop();
    setIsSpeaking(false);
    
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setAudioBlob(null);
      setApiError(null);
    } else {
      finishInterview();
    }
  };
  
  const finishInterview = async () => {
    stopRecording();
    stopMediaStream();
    
    if (interviewId) {
      try {
        await updateInterview(interviewId, {
          status: 'completed',
          completed_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error completing interview:', error);
      }
    }
    
    onInterviewComplete(answers, facialData);
  };
  
  const repeatQuestion = () => {
    ttsService.stop();
    setIsSpeaking(false);
    speakQuestion();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Interview in Progress</h1>
        <p className="mt-2 text-gray-600">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>
      
      {apiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            <span className="text-amber-800">{apiError}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="bg-gray-50 border-b">
              <h2 className="text-xl font-medium">
                Question {currentQuestionIndex + 1}:
              </h2>
              <p className={`mt-2 text-lg ${isSpeaking ? 'text-brand-purple font-medium' : ''}`}>
                {questions[currentQuestionIndex]}
              </p>
              {isSpeaking && (
                <div className="mt-3 flex items-center">
                  <span className="mr-2 inline-block w-2 h-2 bg-brand-purple rounded-full animate-pulse"></span>
                  <span className="text-sm text-gray-500">AI is speaking...</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center p-6">
              {!mediaStream ? (
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Video className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Camera Access Required</h3>
                  <p className="text-gray-500 mb-6">
                    We need access to your camera and microphone to record your interview responses.
                  </p>
                  <Button onClick={requestMediaPermissions}>
                    Enable Camera & Microphone
                  </Button>
                </div>
              ) : (
                <div className="w-full">
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video mb-6">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full"
                    ></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    
                    {(isRecordingAudio || isRecordingVideo) && (
                      <div className="absolute top-4 right-4 flex items-center bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm">Recording</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-3 mb-4">
                    <Button 
                      variant={isRecordingAudio ? "destructive" : "outline"} 
                      onClick={isRecordingAudio ? stopRecording : startRecording}
                    >
                      {isRecordingAudio ? (
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
                    <Button 
                      variant="outline" 
                      onClick={repeatQuestion}
                      disabled={isSpeaking}
                    >
                      Repeat Question
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 border-t flex justify-between">
              <Button 
                variant="ghost"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              >
                Previous
              </Button>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleSkipQuestion}
                >
                  Skip
                </Button>
                <Button 
                  onClick={handleNextQuestion}
                >
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    'Finish Interview'
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <h3 className="font-medium">Interview Progress</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questions.map((q, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-md text-sm ${
                      index === currentQuestionIndex
                        ? 'bg-brand-purple text-white'
                        : index < currentQuestionIndex
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    Question {index + 1}
                    {index < currentQuestionIndex && (
                      <span className="ml-2">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <h3 className="font-medium">Tips</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="inline-block bg-brand-purple text-white w-5 h-5 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">1</span>
                  <span>Speak clearly and at a moderate pace</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-brand-purple text-white w-5 h-5 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">2</span>
                  <span>Maintain eye contact with the camera</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-brand-purple text-white w-5 h-5 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">3</span>
                  <span>Structure your answers using the STAR method</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block bg-brand-purple text-white w-5 h-5 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">4</span>
                  <span>Take a moment to organize your thoughts before answering</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;
