import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Play, FileText, Users, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import interviewService from '@/services/interviewService';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';

const InterviewsPage: React.FC = () => {
  const { user, isStudent, getSupabaseUserId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<'setup' | 'interview' | 'completed'>('setup');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Interview data
  const [questions, setQuestions] = useState<string[]>([]);
  const [idealAnswers, setIdealAnswers] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  const startBasicInterview = async () => {
    try {
      setIsGenerating(true);
      
      // Generate HR and technical questions
      const questionSet = await interviewService.generateHRTechnicalQuestions(questionCount);
      
      // Create interview session
      const session = await interviewService.createInterviewSession(
        'basic_hr_technical',
        questionCount,
        questionSet.questions,
        questionSet.ideal_answers,
        getSupabaseUserId() || '' // Get the Supabase user ID from auth context
      );
      
      setQuestions(questionSet.questions);
      setIdealAnswers(questionSet.ideal_answers);
      setSessionId(session.id);
      setCurrentStep('interview');
      
      toast({
        title: "Interview Ready",
        description: `Generated ${questionCount} HR and technical questions`,
      });
    } catch (error: any) {
      console.error('Error starting basic interview:', error);
      toast({
        title: "Failed to Start Interview",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInterviewComplete = async (data: { 
    questions: string[], 
    answers: string[], 
    evaluations: any[],
    facialAnalysis: any[],
    interviewId?: string 
  }) => {
    try {
      // Perform bulk evaluation
      const bulkEvaluation = await interviewService.bulkEvaluateAnswers(
        questions,
        data.answers,
        idealAnswers
      );
      
      // Update session with results
      if (sessionId) {
        await interviewService.updateInterviewSession(
          sessionId,
          data.answers,
          bulkEvaluation.evaluations,
          bulkEvaluation.overall_statistics.average_score
        );
      }
      
      setUserAnswers(data.answers);
      setEvaluations(bulkEvaluation.evaluations);
      setCurrentStep('completed');
      
      toast({
        title: "Interview Completed",
        description: `Overall Score: ${bulkEvaluation.overall_statistics.average_score.toFixed(1)}/10`,
      });
    } catch (error: any) {
      console.error('Error completing interview:', error);
      toast({
        title: "Evaluation Failed",
        description: "Interview completed but evaluation failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetInterview = () => {
    setCurrentStep('setup');
    setQuestions([]);
    setIdealAnswers([]);
    setUserAnswers([]);
    setEvaluations([]);
    setSessionId('');
  };

  const goToCustomInterviews = () => {
    navigate('/custom-interviews');
  };

  if (currentStep === 'interview') {
    return (
      <DashboardLayout>
        <InterviewPrep
          questions={questions}
          onComplete={handleInterviewComplete}
          interviewType="basic_hr_technical"
        />
      </DashboardLayout>
    );
  }

  if (currentStep === 'completed') {
    return (
      <DashboardLayout>
        <InterviewReport
          questions={questions}
          answers={userAnswers}
          evaluations={evaluations}
          idealAnswers={idealAnswers}
          interviewType="basic_hr_technical"
          onDone={resetInterview}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Practice</h1>
            <p className="mt-2 text-gray-600">
              Choose your interview type and start practicing
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic HR + Technical Interview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-600" />
                Basic Interview
              </CardTitle>
              <CardDescription>
                HR behavioral questions + basic technical concepts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="questionCount">Number of Questions</Label>
                <Select 
                  value={questionCount.toString()} 
                  onValueChange={(value) => setQuestionCount(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="6">6 Questions</SelectItem>
                    <SelectItem value="7">7 Questions</SelectItem>
                    <SelectItem value="8">8 Questions</SelectItem>
                    <SelectItem value="9">9 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  • Communication & teamwork questions
                </p>
                <p className="text-sm text-gray-600">
                  • Problem-solving scenarios
                </p>
                <p className="text-sm text-gray-600">
                  • Basic technical concepts
                </p>
              </div>
              
              <Button 
                onClick={startBasicInterview}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Questions...
                  </div>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Basic Interview
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Custom Interviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-purple-600" />
                Custom Interview
              </CardTitle>
              <CardDescription>
                Role-specific or resume-based questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  • Field-specific technical questions
                </p>
                <p className="text-sm text-gray-600">
                  • Role-based scenarios
                </p>
                <p className="text-sm text-gray-600">
                  • Resume-based personalized questions
                </p>
              </div>
              
              <Button 
                onClick={goToCustomInterviews}
                variant="outline"
                className="w-full"
              >
                <Briefcase className="mr-2 h-4 w-4" />
                Go to Custom Interviews
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  1
                </div>
                <h4 className="font-medium mb-1">Choose Interview Type</h4>
                <p className="text-sm text-gray-600">Select between basic or custom interviews</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  2
                </div>
                <h4 className="font-medium mb-1">Answer Questions</h4>
                <p className="text-sm text-gray-600">Respond to AI-generated questions</p>
              </div>
              <div>
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">
                  3
                </div>
                <h4 className="font-medium mb-1">Get Detailed Feedback</h4>
                <p className="text-sm text-gray-600">Receive strict evaluation and improvement tips</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InterviewsPage;