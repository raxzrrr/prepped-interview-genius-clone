
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Calendar, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useLearningData } from '@/hooks/useLearningData';
import { Badge } from '@/components/ui/badge';

const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const { userLearningData, loading } = useLearningData(7); // Total modules in the course
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    if (userLearningData) {
      generateCertificates();
    }
  }, [userLearningData]);

  const generateCertificates = () => {
    const availableCertificates = [];

    // Course completion certificate
    if (userLearningData?.course_completed_at && userLearningData?.course_score) {
      availableCertificates.push({
        id: 'course-completion',
        title: 'Interview Mastery Course Completion',
        description: 'Certificate for completing the Interview Mastery Course',
        type: 'course',
        earned: true,
        earnedDate: userLearningData.course_completed_at,
        score: userLearningData.course_score,
        requirements: 'Complete all course modules',
        icon: Award
      });
    }

    // Assessment certificate
    if (userLearningData?.assessment_completed_at && userLearningData?.assessment_score && userLearningData.assessment_score >= 80) {
      availableCertificates.push({
        id: 'assessment-excellence',
        title: 'Technical Assessment Excellence',
        description: 'Certificate for scoring 80% or higher on the technical assessment',
        type: 'assessment',
        earned: true,
        earnedDate: userLearningData.assessment_completed_at,
        score: userLearningData.assessment_score,
        requirements: 'Score 80% or higher on the technical assessment',
        icon: Award
      });
    }

    // Add locked certificates for items not yet earned
    if (!userLearningData?.course_completed_at) {
      availableCertificates.push({
        id: 'course-completion-locked',
        title: 'Interview Mastery Course Completion',
        description: 'Complete all course modules to earn this certificate',
        type: 'course',
        earned: false,
        requirements: 'Complete all course modules',
        progress: userLearningData ? Math.round((userLearningData.completed_modules / userLearningData.total_modules) * 100) : 0,
        icon: Lock
      });
    }

    if (!userLearningData?.assessment_completed_at || !userLearningData?.assessment_score || userLearningData.assessment_score < 80) {
      availableCertificates.push({
        id: 'assessment-excellence-locked',
        title: 'Technical Assessment Excellence',
        description: 'Score 80% or higher on the technical assessment to earn this certificate',
        type: 'assessment',
        earned: false,
        requirements: 'Score 80% or higher on the technical assessment',
        progress: userLearningData?.assessment_score || 0,
        icon: Lock
      });
    }

    setCertificates(availableCertificates);
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      // This would typically call a backend service to generate the PDF
      console.log('Downloading certificate:', certificateId);
      
      // For now, we'll show a success message
      // In a real implementation, this would generate and download a PDF certificate
      alert('Certificate download would start here. This feature needs to be implemented with a PDF generation service.');
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your certificates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="mt-2 text-gray-600">
            View and download certificates for your learning achievements
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Earned Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {certificates.filter(cert => cert.earned).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Available Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {certificates.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-purple">
                {userLearningData ? Math.round((userLearningData.completed_modules / userLearningData.total_modules) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => {
            const IconComponent = certificate.icon;
            return (
              <Card key={certificate.id} className={`overflow-hidden ${certificate.earned ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <IconComponent className={`mr-3 h-8 w-8 ${certificate.earned ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <CardTitle className="text-lg">{certificate.title}</CardTitle>
                        {certificate.earned && (
                          <Badge className="mt-1 bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Earned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {certificate.description}
                  </CardDescription>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Requirements:</p>
                      <p className="text-sm text-gray-600">{certificate.requirements}</p>
                    </div>
                    
                    {certificate.earned ? (
                      <div className="space-y-2">
                        {certificate.earnedDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="mr-2 h-4 w-4" />
                            Earned on {new Date(certificate.earnedDate).toLocaleDateString()}
                          </div>
                        )}
                        {certificate.score && (
                          <div className="text-sm">
                            <span className="font-medium">Score: </span>
                            <span className="text-green-600 font-bold">{certificate.score}%</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{certificate.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-brand-purple h-2 rounded-full transition-all duration-300"
                            style={{ width: `${certificate.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardContent className="pt-0">
                  {certificate.earned ? (
                    <Button 
                      onClick={() => handleDownloadCertificate(certificate.id)}
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Certificate
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      disabled 
                      className="w-full"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Complete Requirements
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {certificates.length === 0 && (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No certificates yet</h3>
            <p className="mt-2 text-gray-600">
              Complete the Interview Mastery Course to earn your first certificate.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/learning'}>
              Start Learning
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
