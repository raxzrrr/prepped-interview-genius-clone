
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
import { Label } from "@/components/ui/label";
import { useToast } from '@/components/ui/use-toast';
import { BriefcaseIcon, Clock, PlayCircle, AlertCircle, Upload, FileText, User, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import ApiKeySettings from '@/components/Settings/ApiKeySettings';
import envService from '@/services/env';
import { generateConsistentUUID } from '@/utils/userUtils';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [interviewAnswers, setInterviewAnswers] = useState<string[]>([]);
  const [facialAnalysis, setFacialAnalysis] = useState<any[]>([]);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [stage, setStage] = useState<'select' | 'interview' | 'report'>('select');
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
  
  const { getInterviews, saveInterview } = useInterviewApi();

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
      
      const custom = interviews?.filter(i => 
        i.title.includes('Custom') && !i.title.includes('Resume-based')
      ).length || 0;
      const resume = interviews?.filter(i => 
        i.title.includes('Resume-based') || i.title.includes('Resume')
      ).length || 0;
      
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
  
  const handleResumeAnalysisComplete = async (questions: string[]) => {
    // Save resume-based interview to database
    if (user && questions.length > 0) {
      try {
        const newInterviewData = {
          user_id: user.id,
          title: `Resume-based Interview`,
          questions: questions,
          status: 'in-progress'
        };
        
        const savedInterviewId = await saveInterview(newInterviewData);
        setInterviewId(savedInterviewId);
        
        // Refresh usage data after saving
        fetchUserInterviewUsage();
      } catch (error) {
        console.error("Error saving resume-based interview:", error);
        toast({
          title: "Warning",
          description: "Interview questions generated but failed to save session. You can still proceed.",
          variant: "destructive",
        });
      }
    }
    
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
                      <span className="text-sm text-gray-500">Resume Interviews</span>
                      <span className={`text-sm font-medium ${usageData.resume_interviews >= 10 ? 'text-red-500' : 'text-green-500'}`}>
                        {usageData.resume_interviews}/10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${usageData.resume_interviews >= 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(usageData.resume_interviews / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Custom Interviews</span>
                      <span className={`text-sm font-medium ${usageData.custom_interviews >= 10 ? 'text-red-500' : 'text-green-500'}`}>
                        {usageData.custom_interviews}/10
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${usageData.custom_interviews >= 10 ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(usageData.custom_interviews / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <p>Limits reset every 30 days</p>
                </div>
              </CardContent>
            </Card>

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
          </div>

          {/* Improvement Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle>Improvement Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Practice maintaining consistent eye contact
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Use the STAR method for behavioral questions
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-brand-purple flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    Include more quantifiable results in your answers
                  </span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                View Full Report
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/custom-interviews')}
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Start Role-Based Interview
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/interviews')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View All Interviews
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/reports')}
                >
                  <User className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Card for new users */}
          {userStats.totalInterviews === 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Welcome to Interview Genius! Start by choosing an interview type below.
                </p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-brand-purple/10 p-2 rounded-full">
                      <Upload className="h-5 w-5 text-brand-purple" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Upload Your Resume</h4>
                      <p className="text-xs text-gray-500">
                        Get tailored questions based on your skills and experience
                      </p>
                    </div>
                  </div>
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
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Resume-Based Interview</CardTitle>
              <CardDescription>
                Upload your resume to get personalized interview questions tailored to your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resume-file">Resume Analysis & Interview</Label>
                  <p className="text-sm text-gray-500">
                    Our AI will analyze your resume and generate relevant interview questions based on your skills and experience.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => navigate('/custom-interviews')}
                disabled={usageData.resume_interviews >= 10}
              >
                <Upload className="mr-2 h-4 w-4" />
                {usageData.resume_interviews >= 10 ? 'Monthly Limit Reached' : 'Start Resume-Based Interview'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role-Based Interview</CardTitle>
              <CardDescription>
                Practice interviews for specific job roles with customized questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">
                    Enter a specific job role and get targeted interview questions tailored to that position.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => navigate('/custom-interviews')}
                disabled={usageData.custom_interviews >= 10}
              >
                <Briefcase className="mr-2 h-4 w-4" />
                {usageData.custom_interviews >= 10 ? 'Monthly Limit Reached' : 'Start Role-Based Interview'}
              </Button>
            </CardFooter>
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
