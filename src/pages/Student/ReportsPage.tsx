
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Play } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';

const ReportsPage: React.FC = () => {
  const { user, isStudent } = useAuth();

  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-2 text-gray-600">
            Download your interview reports after completing sessions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="mr-2 h-5 w-5 text-brand-purple" />
              Interview Reports
            </CardTitle>
            <CardDescription>
              Generate and download detailed reports from your interview sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-4">No Saved Reports</h3>
            <div className="max-w-md mx-auto mb-6">
              <p className="text-gray-600 mb-4">
                Reports are generated after each interview session and can be downloaded immediately. 
                Reports include your questions, answers, AI feedback, and performance analysis.
              </p>
              <p className="text-sm text-gray-500">
                Reports are not stored permanently - make sure to download them after each interview.
              </p>
            </div>
            <Button onClick={() => window.location.href = '/custom-interviews'} className="w-full max-w-sm">
              <Play className="mr-2 h-4 w-4" />
              Start Interview to Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
