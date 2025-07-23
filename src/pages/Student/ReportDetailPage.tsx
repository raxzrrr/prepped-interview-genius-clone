
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';

const ReportDetailPage: React.FC = () => {
  const { user, isStudent } = useAuth();

  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Reports</h1>
            <p className="mt-2 text-gray-600">
              Reports are available after completing interviews
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Report Not Available
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="max-w-md mx-auto">
              <p className="text-gray-600 mb-6">
                Interview reports are generated after completing an interview session. 
                Reports are provided as downloadable PDFs and are not stored permanently.
              </p>
              <Button onClick={() => window.location.href = '/custom-interviews'}>
                Start New Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportDetailPage;
