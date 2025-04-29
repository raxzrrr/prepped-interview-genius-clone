import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ResumeUpload from '@/components/Dashboard/ResumeUpload';
import InterviewPrep from '@/components/Dashboard/InterviewPrep';
import InterviewReport from '@/components/Dashboard/InterviewReport';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Clock, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { user, isStudent } = useAuth();
  const [dashboardState, setDashboardState] = useState<'upload' | 'interview' | 'report'>('upload');
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }
  
  const handleAnalysisComplete = (questions: string[]) => {
    setGeneratedQuestions(questions);
    setDashboardState('interview');
  };
  
  const handleInterviewComplete = () => {
    setAnswers(generateMockAnswers(generatedQuestions));
    setDashboardState('report');
  };
  
  const startNewInterview = () => {
    setDashboardState('upload');
    setGeneratedQuestions([]);
    setAnswers([]);
  };
  
  // Mock function to generate answers
  const generateMockAnswers = (questions: string[]): string[] => {
    return questions.map(() => "This is a simulated answer to the interview question.");
  };
  
  const renderDashboardContent = () => {
    switch (dashboardState) {
      case 'upload':
        return <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />;
      case 'interview':
        return <InterviewPrep questions={generatedQuestions} onInterviewComplete={handleInterviewComplete} />;
      case 'report':
        return <InterviewReport questions={generatedQuestions} answers={answers} onStartNewInterview={startNewInterview} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user.name}! Practice your interview skills and track your progress.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Interview Sessions</CardTitle>
              <Video className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-gray-500">
                +1 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Learning Hours</CardTitle>
              <Clock className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5</div>
              <p className="text-xs text-gray-500">
                +3.2 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
              <FileText className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-gray-500">
                +2 from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Activity className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">76%</div>
              <p className="text-xs text-gray-500">
                +5% from last week
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="interview-practice" className="space-y-4">
          <TabsList>
            <TabsTrigger value="interview-practice">Interview Practice</TabsTrigger>
            <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="recommended">Recommended Courses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interview-practice" className="space-y-4">
            {renderDashboardContent()}
          </TabsContent>
          
          <TabsContent value="recent-activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest activity on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-md">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Completed Interview Session</h3>
                      <p className="text-sm text-gray-500">Software Engineer Role Practice</p>
                      <p className="text-xs text-gray-400">3 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-purple-100 rounded-md">
                      <Video className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Watched Course Video</h3>
                      <p className="text-sm text-gray-500">Answering Behavioral Questions</p>
                      <p className="text-xs text-gray-400">5 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-green-100 rounded-md">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Completed Course Module</h3>
                      <p className="text-sm text-gray-500">Technical Interview Fundamentals</p>
                      <p className="text-xs text-gray-400">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommended">
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>
                  Courses that match your career goals and needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg hover:border-brand-purple hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Mastering Behavioral Interviews</h3>
                      <Badge className="bg-brand-purple">Recommended</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Learn how to structure compelling stories for behavioral questions using the STAR method.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:border-brand-purple hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Body Language and Facial Expressions</h3>
                      <Badge variant="outline">90% match</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Understand how your non-verbal cues affect interviewer perception and how to improve them.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg hover:border-brand-purple hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Technical Interview Deep Dive</h3>
                      <Badge variant="outline">85% match</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Prepare for technical questions with practical exercises and expert tips.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
