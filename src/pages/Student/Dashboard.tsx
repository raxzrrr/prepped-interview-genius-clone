
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from '@/components/ui/use-toast';
import { BriefcaseIcon, Clock, Users, PlayCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInterviewApi } from '@/services/api';
import ApiKeySettings from '@/components/Settings/ApiKeySettings';
import envService from '@/services/env';

const Dashboard: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { toast } = useToast();
  const [selectedJobRole, setSelectedJobRole] = useState('Software Engineer');
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<string[]>([]);
  const [facialAnalysis, setFacialAnalysis] = useState<any[]>([]);
  const [stage, setStage] = useState<'select' | 'interview' | 'report'>('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const [interviewId, setInterviewId] = useState<string | undefined>();
  const [showApiSettings, setShowApiSettings] = useState(false);
  const { generateInterviewQuestions, saveInterview } = useInterviewApi();

  // Check if API key is configured when component mounts
  useEffect(() => {
    if (!envService.isConfigured('GEMINI_API_KEY')) {
      setShowApiSettings(true);
    }
  }, []);

  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  const jobRoles = [
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'UX Designer',
    'Marketing Manager',
    'Sales Representative',
    'Project Manager',
    'Financial Analyst',
    'Human Resources Specialist',
    'Customer Success Manager'
  ];

  const startInterview = async () => {
    setIsGenerating(true);

    try {
      // Generate interview questions
      const questions = await generateInterviewQuestions(selectedJobRole);
      const questionTexts = questions.map(q => q.question);
      
      if (questionTexts.length === 0) {
        throw new Error('Failed to generate questions');
      }
      
      setInterviewQuestions(questionTexts);
      
      // Create a new interview record in the database
      const newInterviewData = {
        user_id: user.id,
        title: `${selectedJobRole} Interview Practice`,
        questions: questionTexts,
        status: 'in-progress'
      };
      
      const id = await saveInterview(newInterviewData);
      setInterviewId(id);
      
      setStage('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start the interview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInterviewComplete = (answers: string[], facialData: any[]) => {
    setInterviewAnswers(answers);
    setFacialAnalysis(facialData);
    setStage('report');
  };

  const startNewInterview = () => {
    setStage('select');
    setInterviewQuestions([]);
    setInterviewAnswers([]);
    setFacialAnalysis([]);
    setInterviewId(undefined);
  };

  const handleApiSetupComplete = () => {
    setShowApiSettings(false);
    toast({
      title: "API Key Configured",
      description: "You can now use all AI-powered interview features.",
    });
  };

  if (showApiSettings) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Setup Required</h1>
          <p className="text-gray-600 mb-8">
            To use the AI-powered interview features, you need to configure your Google Gemini API key.
          </p>
          <ApiKeySettings onComplete={handleApiSetupComplete} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {stage === 'select' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Preparation</h1>
            <p className="mt-2 text-gray-600">
              Practice your interview skills with our AI-powered mock interview system
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-gray-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Interviews Completed</span>
                    <span className="text-lg font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Interview</span>
                    <span className="text-sm">2 days ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Average Score</span>
                    <span className="text-lg font-semibold text-brand-purple">84%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-gray-500" />
                  Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Technical Knowledge</span>
                    <span className="text-sm font-medium text-green-600">92%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Communication</span>
                    <span className="text-sm font-medium text-green-600">88%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Problem Solving</span>
                    <span className="text-sm font-medium text-brand-purple">83%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Cultural Fit</span>
                    <span className="text-sm font-medium text-amber-600">76%</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-gray-500" />
                  Improvement Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Conciseness</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Eye Contact</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Quantifiable Results</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: '55%' }}></div>
                    </div>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Confidence</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Start New Interview</CardTitle>
              <CardDescription>
                Choose a job role and begin your AI-powered interview practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Job Role</Label>
                <Select
                  value={selectedJobRole}
                  onValueChange={setSelectedJobRole}
                >
                  <SelectTrigger id="role-select" className="w-full md:w-1/2">
                    <SelectValue placeholder="Select a job role" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRoles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 bg-white p-2 rounded-full border border-gray-200">
                    <BriefcaseIcon className="h-6 w-6 text-brand-purple" />
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedJobRole}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Practice for a {selectedJobRole} position with AI-generated questions specific to this role.
                      Our system will analyze your responses and provide detailed feedback.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={startInterview}
                disabled={isGenerating}
                className="w-full md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Interview
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resume Analysis</CardTitle>
              <CardDescription>
                Upload your resume to receive AI-powered feedback and suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResumeUpload />
            </CardContent>
          </Card>
        </div>
      )}
      
      {stage === 'interview' && (
        <InterviewPrep
          questions={interviewQuestions}
          interviewId={interviewId}
          onInterviewComplete={handleInterviewComplete}
        />
      )}
      
      {stage === 'report' && (
        <InterviewReport
          questions={interviewQuestions}
          answers={interviewAnswers}
          onStartNewInterview={startNewInterview}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
