import React, { useState } from 'react';
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

interface InterviewPrepProps {
  questions: string[];
  onInterviewComplete: () => void;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ questions, onInterviewComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [facialExpressions, setFacialExpressions] = useState<string[]>([]);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];
  
  const toggleMic = () => {
    setMicEnabled(!micEnabled);
    toast({
      title: !micEnabled ? "Microphone Enabled" : "Microphone Disabled",
      description: !micEnabled ? "Your microphone is now active." : "Your microphone has been turned off.",
    });
  };
  
  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
    toast({
      title: !cameraEnabled ? "Camera Enabled" : "Camera Disabled",
      description: !cameraEnabled ? "Your camera is now active." : "Your camera has been turned off.",
    });
  };
  
  const startRecording = () => {
    if (!micEnabled || !cameraEnabled) {
      toast({
        title: "Enable Devices",
        description: "Please enable both microphone and camera to start the interview.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRecording(true);
    toast({
      title: "Recording Started",
      description: "You are now recording your answer. Speak clearly into your microphone.",
    });
    
    // Simulate facial expression analysis
    const expressions = ['neutral', 'happy', 'anxious', 'focused', 'confused'];
    const interval = setInterval(() => {
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
      setFacialExpressions(prev => [...prev, randomExpression]);
    }, 2000);
    
    // Clean up after 15 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 15000);
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    
    // Simulate captured answer
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
    
    toast({
      title: "Recording Stopped",
      description: "Your answer has been recorded.",
    });
  };
  
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFacialExpressions([]);
    } else {
      // Interview completed
      onInterviewComplete();
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
                <div className="flex flex-col items-center justify-center h-full text-white">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 rounded-full border-brand-purple opacity-75"></div>
                  </div>
                  <Video className="w-8 h-8 mb-2" />
                  <p className="text-sm">Camera active</p>
                </div>
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
                  {expression}
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
    </Card>
  );
};

export default InterviewPrep;
