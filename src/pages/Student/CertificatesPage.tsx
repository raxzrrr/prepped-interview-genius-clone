
import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import ProFeatureGuard from '@/components/ProFeatureGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Download, Calendar } from 'lucide-react';

const CertificatesPage: React.FC = () => {
  const { user, isStudent } = useAuth();

  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-2 text-gray-600">
            View and download your professional certificates
          </p>
        </div>

        <ProFeatureGuard 
          featureName="Professional Certificates"
          description="Earn and download professional certificates after completing courses and assessments. These certificates validate your interview preparation skills and can be shared with potential employers."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Completed</span>
                </div>
                <CardTitle className="text-lg">Interview Mastery Certificate</CardTitle>
                <CardDescription>
                  Comprehensive technical interview preparation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Completed: March 15, 2024
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Award className="h-4 w-4 mr-2" />
                    Score: 92%
                  </div>
                  <button className="w-full flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                    <Download className="h-4 w-4 mr-2" />
                    Download Certificate
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-400 font-medium">Locked</span>
                </div>
                <CardTitle className="text-lg text-gray-600">System Design Certificate</CardTitle>
                <CardDescription>
                  Advanced system design interview preparation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Complete the System Design course to unlock this certificate
                  </p>
                  <div className="bg-gray-100 rounded-md py-2 px-4 text-sm text-gray-600">
                    Progress: 0/8 modules completed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-400 font-medium">Locked</span>
                </div>
                <CardTitle className="text-lg text-gray-600">Behavioral Interview Certificate</CardTitle>
                <CardDescription>
                  Master behavioral interview techniques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Complete the Behavioral Interview course to unlock this certificate
                  </p>
                  <div className="bg-gray-100 rounded-md py-2 px-4 text-sm text-gray-600">
                    Progress: 0/6 modules completed
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ProFeatureGuard>
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
