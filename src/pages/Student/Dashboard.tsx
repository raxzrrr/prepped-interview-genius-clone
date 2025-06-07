import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import ResumeAnalysisResults from '@/components/Dashboard/ResumeAnalysisResults';
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
import { BriefcaseIcon, Clock, PlayCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import ApiKeySettings from '@/components/Settings/ApiKeySettings';
import envService from '@/services/env';
import { generateConsistentUUID } from '@/utils/userUtils';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { toast } = useToast();
  const [selectedJobRole, setSelectedJobRole] = useState('Software Engineer');
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<string[]>([]);
  const [facialAnalysis, setFacialAnalysis] = useState<any[]>([]);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [stage, setStage] = useState<'select' | 'interview' | 'report'>('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const [interviewId, setInterviewId] = useState<string | undefined>();
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [usageData, setUsageData] = useState<{ custom_interviews: number, resume_interviews: number }>({ 
    custom_interviews: 0, 
    resume_interviews: 0 
  });
  const [userStats, setUserStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    totalQuestions: 0,
    completedInterviews: []
  });
  
  const { generateInterviewQuestions, saveInterview, getInterviews } = useInterviewApi();

  // Check if API key is configured when component mounts
  useEffect(() => {
    const geminiApiKey = envService.get('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      setShowApiSettings(true);
    }
    
    if (user) {
      fetchUserInterviewUsage();
      fetchUserStats();
    }
  }, [user]);
  
  // Fetch interview usage
  const fetchUserInterviewUsage = async () => {
    if (!user) return;
    
    try {
      const supabaseUserId = generateConsistentUUID(user.id);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: interviews, error } = await supabase
        .from('interviews')
        .select('id, title')
        .eq('user_id', supabaseUserId)
        .gte('created_at', firstDayOfMonth.toISOString());
      
      if (error) {
        console.error('Error fetching usage data:', error);
        return;
      }
      
      const custom = interviews?.filter(i => i.title.includes('Custom') || !i.title.includes('Resume-based')).length || 0;
      const resume = interviews?.filter(i => i.title.includes('Resume-based')).length || 0;
      
      setUsageData({ 
        custom_interviews: custom,
        resume_interviews: resume
      });
      
    } catch (error) {
      console.error('Error fetching user interview usage:', error);
    }
  };
  
  // Fetch user statistics
  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const interviews = await getInterviews(user.id);
      
      if (interviews) {
        const completed = interviews.filter(interview => interview.status === 'completed');
        const questionCount = interviews.reduce((acc, curr) => 
          acc + (Array.isArray(curr.questions) ? curr.questions.length : 0), 0);
        const avgScore = completed.length > 0 
          ? Math.round(completed.reduce((acc, curr) => acc + (curr.score || 0), 0) / completed.length) 
          : 0;
          
        setUserStats({
          totalInterviews: interviews.length,
          averageScore: avgScore,
          totalQuestions: questionCount,
          completedInterviews: completed
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

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
    if (usageData.custom_interviews >= 2) {
      toast({
        title: "Monthly Limit Reached",
        description: "You've reached your limit of 2 custom interviews this month.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);

    try {
      const questions = await generateInterviewQuestions(selectedJobRole);
      const questionTexts = questions.map(q => q.question);
      
      if (questionTexts.length === 0) {
        throw new Error('Failed to generate questions');
      }
      
      setInterviewQuestions(questionTexts);
      
      // Pass the Clerk user ID directly
      const newInterviewData = {
        user_id: user.id, // This is the Clerk user ID
        title: `${selectedJobRole} Interview Practice`,
        questions: questionTexts,
        status: 'in-progress'
      };
      
      console.log('Creating interview with user ID:', user.id);
      const id = await saveInterview(newInterviewData);
      setInterviewId(id);
      
      setStage('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      // Don't show generic error message, the specific error is already shown by the API service
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInterviewComplete = (answers: string[], facialData: any[]) => {
    setInterviewAnswers(answers);
    setFacialAnalysis(facialData);
    setStage('report');
    fetchUserStats();
    fetchUserInterviewUsage();
  };

  const startNewInterview = () => {
    setStage('select');
    setInterviewQuestions([]);
    setInterviewAnswers([]);
    setFacialAnalysis([]);
    setInterviewId(undefined);
    setResumeAnalysis(null);
    fetchUserInterviewUsage();
    fetchUserStats();
  };

  const handleApiSetupComplete = () => {
    setShowApiSettings(false);
    toast({
      title: "API Key Configured",
      description: "You can now use all AI-powered interview features.",
    });
  };
  
  const handleResumeAnalysisComplete = (questions: string[]) => {
    setInterviewQuestions(questions);
    setStage('interview');
  };
  
  const handleResumeAnalysisResults = (analysis: any) => {
    setResumeAnalysis(analysis);
  };

  if (showApiSettings) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
              <h2 className="text-lg font-semibold text-amber-800">API Configuration Required</h2>
            </div>
            <p className="text-amber-700">
              The AI interview features require a Google Gemini API key to function properly. 
              Without this configuration, the system cannot generate real interview questions or provide analysis.
            </p>
          </div>
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
            <h1 className="text-3xl font-bold tracking-tight mb-6">Interview Preparation</h1>
            <p className="mt-2 text-gray-600">
              Practice your interview skills with our AI-powered mock interview system
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-gray-500" />
                  Monthly Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Custom Interviews</span>
                      <span className={`text-sm font-medium ${usageData.custom_interviews >= 2 ? 'text-red-500' : 'text-green-500'}`}>
                        {usageData.custom_interviews}/2
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${usageData.custom_interviews >= 2 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(usageData.custom_interviews / 2) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Resume Interviews</span>
                      <span className={`text-sm font-medium ${usageData.resume_interviews >= 2 ? 'text-red-500' : 'text-green-500'}`}>
                        {usageData.resume_interviews}/2
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${usageData.resume_interviews >= 2 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(usageData.resume_interviews / 2) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <p>Limits reset every 30 days</p>
                </div>
              </CardContent>
            </Card>

            {/* Remove fake statistics data for new users */}
            {userStats.totalInterviews > 0 ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center">
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Average Score</span>
                        <span className="text-lg font-bold text-brand-purple">{userStats.averageScore}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Total Interviews</span>
                        <span className="text-lg font-bold">{userStats.totalInterviews}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Total Questions</span>
                        <span className="text-lg font-bold">{userStats.totalQuestions}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Recent Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userStats.completedInterviews.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          "Your technical answers are solid, but try to include more specific examples from your experience."
                        </p>
                        <p className="text-sm text-gray-600">
                          "Good engagement and facial expressions. You appear confident and engaged during the interview."
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Complete an interview to receive feedback on your performance.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle>Getting Started</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Welcome to Interview Genius! Start by choosing a job role and preparing for your first interview.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-brand-purple/10 p-2 rounded-full">
                          <PlayCircle className="h-5 w-5 text-brand-purple" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Practice with AI</h4>
                          <p className="text-xs text-gray-500">
                            Experience realistic interview scenarios with our AI interviewer
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-brand-purple/10 p-2 rounded-full">
                          <BriefcaseIcon className="h-5 w-5 text-brand-purple" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Upload Your Resume</h4>
                          <p className="text-xs text-gray-500">
                            Get tailored questions based on your skills and experience
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Select Job Role</CardTitle>
              <CardDescription>
                Choose a job role for your interview practice session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-role">Job Role</Label>
                  <Select
                    value={selectedJobRole}
                    onValueChange={setSelectedJobRole}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a job role" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-2 sm:space-y-0">
              <Button 
                onClick={startInterview}
                disabled={isGenerating || usageData.custom_interviews >= 2}
                className="w-full sm:w-1/2"
              >
                {isGenerating ? 'Generating Questions...' : 'Start Role-based Interview'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-1/2"
                onClick={() => {
                  const uploadInput = document.getElementById('resume-upload');
                  if (uploadInput) {
                    uploadInput.click();
                  }
                }}
                disabled={usageData.resume_interviews >= 2}
              >
                Upload Resume for Analysis
                <input
                  type="file"
                  id="resume-upload"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== 'application/pdf') {
                        toast({
                          title: "Invalid File Type",
                          description: "Please upload a PDF file only.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        if (event.target?.result) {
                          const base64Data = event.target.result.toString();
                          setResumeAnalysis({
                            isLoading: true,
                            file: base64Data
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </Button>
            </CardFooter>
          </Card>
          
          {resumeAnalysis && (
            <ResumeUpload 
              file={resumeAnalysis.file}
              isLoading={resumeAnalysis.isLoading}
              onAnalysisComplete={handleResumeAnalysisComplete}
              onAnalysisResults={handleResumeAnalysisResults}
            />
          )}
        </div>
      )}

      {stage === 'interview' && (
        <InterviewPrep 
          questions={interviewQuestions}
          interviewId={interviewId}
          onInterviewComplete={handleInterviewComplete}
        />
      )}

      {stage === 'report' && resumeAnalysis && (
        <>
          <InterviewReport 
            questions={interviewQuestions}
            answers={interviewAnswers}
            facialAnalysis={facialAnalysis}
            onDone={startNewInterview}
          />
          <ResumeAnalysisResults analysis={resumeAnalysis} />
        </>
      )}

      {stage === 'report' && !resumeAnalysis && (
        <InterviewReport 
          questions={interviewQuestions}
          answers={interviewAnswers}
          facialAnalysis={facialAnalysis}
          onDone={startNewInterview}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
