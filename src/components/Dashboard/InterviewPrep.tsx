
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Mic, Video, PlayCircle, StopCircle, Download, ArrowRight, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';

interface InterviewPrepProps {
  questions: string[];
  interviewId?: string;
  onInterviewComplete: (answers: string[], facialExpressions: any[]) => void;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ questions, interviewId, onInterviewComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [facialExpressions, setFacialExpressions] = useState<any[]>([]);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioData, setAudioData] = useState<Blob[]>([]);
  const { analyzeFacialExpression, updateInterview } = useInterviewApi();

  const currentQuestion = questions[currentQuestionIndex];
  
  useEffect(() => {
    // Cleanup function to stop all media streams when component unmounts
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleMic = async () => {
    try {
      if (micEnabled) {
        // Turn off microphone
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getAudioTracks().forEach(track => track.stop());
        }
        setMicEnabled(false);
        toast({
          title: "Microphone Disabled",
          description: "Your microphone has been turned off.",
        });
      } else {
        // Turn on microphone
        const audioStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true 
        });
        
        mediaStreamRef.current = mediaStreamRef.current 
          ? new MediaStream([
              ...mediaStreamRef.current.getVideoTracks(),
              ...audioStream.getAudioTracks()
            ])
          : audioStream;
            
        setMicEnabled(true);
        toast({
          title: "Microphone Enabled",
          description: "Your microphone is now active.",
        });
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access your microphone. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  };
  
  const toggleCamera = async () => {
    try {
      if (cameraEnabled) {
        // Turn off camera
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }
        setCameraEnabled(false);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        toast({
          title: "Camera Disabled",
          description: "Your camera has been turned off.",
        });
      } else {
        // Turn on camera
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        
        mediaStreamRef.current = mediaStreamRef.current 
          ? new MediaStream([
              ...mediaStreamRef.current.getAudioTracks(),
              ...videoStream.getVideoTracks()
            ])
          : videoStream;
          
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStreamRef.current;
        }
        
        setCameraEnabled(true);
        toast({
          title: "Camera Enabled",
          description: "Your camera is now active.",
        });
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error",
        description: "Could not access your camera. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  };
  
  const captureFacialExpression = async () => {
    if (!cameraEnabled || !canvasRef.current || !videoRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert the canvas to a data URL (base64)
    const imageBase64 = canvas.toDataURL('image/jpeg');
    
    return imageBase64;
  };
  
  const startRecording = async () => {
    if (!micEnabled || !cameraEnabled) {
      toast({
        title: "Enable Devices",
        description: "Please enable both microphone and camera to start the interview.",
        variant: "destructive",
      });
      return;
    }
    
    if (!mediaStreamRef.current) {
      toast({
        title: "Error",
        description: "Media stream not available. Please try enabling your devices again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRecording(true);
    setAudioData([]);
    
    const options = { mimeType: 'audio/webm' };
    const mediaRecorder = new MediaRecorder(mediaStreamRef.current, options);
    
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      setAudioData(chunks);
    };
    
    mediaRecorder.start();
    
    toast({
      title: "Recording Started",
      description: "You are now recording your answer. Speak clearly into your microphone.",
    });
    
    // Start capturing facial expressions periodically
    const captureInterval = setInterval(async () => {
      const imageBase64 = await captureFacialExpression();
      if (imageBase64) {
        try {
          const analysis = await analyzeFacialExpression(imageBase64);
          if (analysis) {
            setFacialExpressions(prev => [...prev, analysis]);
          }
        } catch (error) {
          console.error('Error analyzing facial expression:', error);
        }
      }
    }, 5000); // Capture every 5 seconds
    
    // Stop after 2 minutes maximum
    setTimeout(() => {
      if (isRecording) {
        clearInterval(captureInterval);
        stopRecording();
      }
    }, 120000);
    
    return captureInterval;
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Simulate transcription with a mock answer
    setTimeout(() => {
      const mockAnswers = [
        "I have extensive experience with React, having used it for the past three years in professional settings. I've built several responsive web applications with complex state management using Redux and Context API. In my previous role, I led the migration from a legacy framework to React, which improved load times by 40%.",
        "In my last role, we faced a critical performance issue with our e-commerce platform during peak traffic. I identified that our database queries weren't optimized, leading to slow page loads. I implemented database indexing and query caching, reducing load times by 60%.",
        "I handle tight deadlines by first breaking down the work into manageable tasks and prioritizing them. I focus on delivering the core functionality first and communicate clearly with stakeholders if timelines might be affected. I'm comfortable putting in extra hours when necessary but also value work-life balance.",
        "I'm excited about this position because it aligns perfectly with my career goals of working with cutting-edge technologies in a collaborative environment. I'm particularly interested in your company's focus on AI-powered solutions, which matches my experience and passion.",
        "My process for implementing new features starts with understanding the requirements thoroughly. I then create a design document, discuss it with team members for feedback, and break down the implementation into small, testable increments. I'm a strong believer in writing tests before code when possible.",
        "I stay updated with industry trends through a combination of online courses, tech blogs, and participating in developer communities. I dedicate at least 5 hours weekly to learning new technologies and attend industry conferences when possible.",
        "I've worked in agile environments for most of my career. In my last role, I served as a SCRUM master for a team of 8 developers. I'm experienced with sprint planning, daily stand-ups, retrospectives, and adapting to changing requirements.",
        "When our team needed to implement a new GraphQL API, I had to learn the technology quickly. I immersed myself in documentation, completed a crash course, and paired with a more experienced colleague. Within two weeks, I was able to contribute meaningfully to the project.",
        "I'm a strong advocate for automated testing. I typically aim for at least 80% code coverage with unit tests and supplement with integration and end-to-end tests. I also value code reviews and static analysis tools to catch issues early.",
        "In 5 years, I see myself in a technical leadership role where I can mentor junior developers while still maintaining hands-on coding skills. I'm interested in architectural decisions and helping shape the technical direction of products.",
        "My greatest achievement was leading a project to redesign our company's main product interface, which increased user engagement by 35% and reduced customer support tickets by 40%. The project was delivered on time and under budget despite significant technical challenges.",
        "I view constructive criticism as an opportunity for growth. I listen carefully, ask clarifying questions if needed, and take time to reflect on the feedback without being defensive. I've regularly sought feedback from colleagues and managers throughout my career.",
        "I believe in clear, concise communication when working with cross-functional teams. I adapt my communication style based on the audience - using technical terms with engineers but focusing on business outcomes when speaking with product or business teams.",
        "I'm motivated by solving complex problems and seeing the direct impact of my work on users. I find great satisfaction in optimizing processes and creating elegant solutions that make people's lives easier.",
        "When our team had to decide whether to refactor a critical component or build a new one from scratch, we had limited data on the technical debt in the existing code. I initiated a spike to assess the most problematic areas, consulted with stakeholders, and ultimately recommended a phased refactoring approach that minimized risk while improving the codebase."
      ];
      
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = mockAnswers[currentQuestionIndex % mockAnswers.length];
      setAnswers(newAnswers);
      
      // Save progress if interview ID is available
      if (interviewId) {
        updateInterview(interviewId, {
          answers: newAnswers,
          facial_analysis: facialExpressions,
          updated_at: new Date().toISOString()
        }).catch(console.error);
      }
      
      toast({
        title: "Recording Processed",
        description: "Your answer has been recorded and transcribed.",
      });
    }, 1500);
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFacialExpressions([]);
    } else {
      // Interview completed
      onInterviewComplete(answers, facialExpressions);
      toast({
        title: "Interview Completed",
        description: "Congratulations! You've completed all the questions.",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Interview Practice</CardTitle>
        <CardDescription>
          Answer the AI-generated questions as if you're in a real interview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</h3>
          <p className="text-lg font-medium text-gray-900">{currentQuestion}</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col p-4 border rounded-lg">
            <h3 className="mb-4 text-sm font-medium text-gray-900">Camera Preview</h3>
            <div className={`relative aspect-video rounded-lg overflow-hidden ${cameraEnabled ? 'bg-gray-800' : 'bg-gray-200'}`}>
              {!cameraEnabled ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Video className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Camera disabled</p>
                </div>
              ) : (
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            <div className="flex justify-between mt-4">
              <Button
                variant={cameraEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleCamera}
                className={cameraEnabled ? "bg-brand-purple" : ""}
              >
                <Video className="w-4 h-4 mr-2" />
                {cameraEnabled ? 'Camera On' : 'Enable Camera'}
              </Button>
              
              <Button
                variant={micEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleMic}
                className={micEnabled ? "bg-brand-purple" : ""}
              >
                <Mic className="w-4 h-4 mr-2" />
                {micEnabled ? 'Mic On' : 'Enable Mic'}
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col p-4 border rounded-lg">
            <h3 className="mb-4 text-sm font-medium text-gray-900">Recording Controls</h3>
            
            <div className="flex-grow flex flex-col items-center justify-center mb-4">
              {isRecording ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-red-100">
                    <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-sm font-medium text-red-600">Recording...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100">
                    {answers[currentQuestionIndex] ? (
                      <Check className="w-8 h-8 text-green-600" />
                    ) : (
                      <Mic className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {answers[currentQuestionIndex] ? 'Answer Recorded' : 'Ready to Record'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {isRecording ? (
                <Button 
                  variant="destructive" 
                  onClick={stopRecording}
                  className="col-span-2"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Recording
                </Button>
              ) : (
                <Button 
                  onClick={startRecording}
                  disabled={!micEnabled || !cameraEnabled || !!answers[currentQuestionIndex]}
                  className="col-span-2"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {facialExpressions.length > 0 && (
          <div className="p-4 border rounded-lg">
            <h3 className="mb-2 text-sm font-medium text-gray-900">Facial Expression Analysis</h3>
            <div className="flex flex-wrap gap-2">
              {facialExpressions.map((expression, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                >
                  {expression.primary_emotion || "analyzing..."}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {answers[currentQuestionIndex] && (
          <div className="p-4 border rounded-lg">
            <h3 className="mb-2 text-sm font-medium text-gray-900">Your Answer</h3>
            <p className="text-gray-700">{answers[currentQuestionIndex]}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={!answers[currentQuestionIndex]}
          onClick={() => {
            const newAnswers = [...answers];
            newAnswers[currentQuestionIndex] = '';
            setAnswers(newAnswers);
            setFacialExpressions([]);
          }}
        >
          Clear Answer
        </Button>
        
        <Button
          onClick={nextQuestion}
          disabled={!answers[currentQuestionIndex]}
        >
          {currentQuestionIndex < questions.length - 1 ? (
            <>
              Next Question
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            'Complete Interview'
          )}
        </Button>
      </CardFooter>
      
      {/* Hidden canvas for capturing video frames */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Card>
  );
};

export default InterviewPrep;
