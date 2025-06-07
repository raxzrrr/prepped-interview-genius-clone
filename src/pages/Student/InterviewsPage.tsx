
import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Play, FileText } from 'lucide-react';

const InterviewsPage: React.FC = () => {
  const { user, isStudent } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }
  
  const startNewInterview = () => {
    navigate('/custom-interviews');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
            <p className="mt-2 text-gray-600">
              Start new practice sessions and download your reports
            </p>
          </div>
          <Button onClick={startNewInterview}>
            <Play className="w-4 h-4 mr-2" />
            Start New Interview
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Interview Practice
            </CardTitle>
            <CardDescription>
              Practice your interview skills with AI-powered mock interviews
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 mb-6">
                Interviews are not saved to your account. After completing each interview, 
                you can download a detailed PDF report with your questions, answers, and feedback.
              </p>
              <Button onClick={startNewInterview} className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Start Your Interview Practice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InterviewsPage;
