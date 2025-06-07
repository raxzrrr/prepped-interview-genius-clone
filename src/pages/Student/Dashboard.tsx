
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import ApiKeySettings from '@/components/Settings/ApiKeySettings';
import envService from '@/services/env';

const Dashboard: React.FC = () => {
  const { user, isStudent } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [usageData, setUsageData] = useState<{ custom_interviews: number, resume_interviews: number }>({ 
    custom_interviews: 0, 
    resume_interviews: 0 
  });

  // Check if API key is configured when component mounts
  useEffect(() => {
    const geminiApiKey = envService.get('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      setShowApiSettings(true);
    }
  }, [user]);

  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

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

  const totalUsage = usageData.custom_interviews + usageData.resume_interviews;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's your interview preparation overview.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Monthly Limits */}
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
                    <span className="text-sm text-gray-500">Total Interviews</span>
                    <span className={`text-sm font-medium ${totalUsage >= 20 ? 'text-red-500' : 'text-green-500'}`}>
                      {totalUsage}/20
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${totalUsage >= 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                      style={{ width: `${(totalUsage / 20) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Resume-based</span>
                    <span className="text-xs text-gray-500">{usageData.resume_interviews}/10</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Custom/Role-based</span>
                    <span className="text-xs text-gray-500">{usageData.custom_interviews}/10</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <p>Limits reset every 30 days</p>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Practice your interview skills with AI-powered mock interviews.
                </p>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500">Available Features:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Resume-based questions</li>
                    <li>• Role-specific interviews</li>
                    <li>• Real-time feedback</li>
                    <li>• Downloadable reports</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Prepare effectively for your next interview with our AI-powered practice sessions.
                </p>
                <ul className="text-xs text-gray-600 space-y-1 mt-2">
                  <li>• Upload your resume for personalized questions</li>
                  <li>• Choose specific job roles to practice for</li>
                  <li>• Review your answers after each session</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Interview Button */}
        <Card>
          <CardHeader>
            <CardTitle>Start Interview Practice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Practice your interview skills with AI-powered mock interviews. Choose between resume-based or role-specific questions.
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/custom-interviews')}
              disabled={totalUsage >= 20}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {totalUsage >= 20 ? 'Monthly Limit Reached' : 'Start Interview Practice'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
