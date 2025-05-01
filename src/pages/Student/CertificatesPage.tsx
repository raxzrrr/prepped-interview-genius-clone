
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Award, CheckCircle, XCircle, BookOpen, LockIcon } from 'lucide-react';

const CertificatesPage: React.FC = () => {
  const { user, isStudent, profile } = useAuth();
  const [downloadingCourse, setDownloadingCourse] = useState(false);
  const [downloadingAssessment, setDownloadingAssessment] = useState(false);
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  // Mock data for certificates
  const certificates = {
    course: {
      name: 'Interview Mastery Course',
      issued: '2025-04-15',
      available: true,
      prerequisites: ['Complete all course modules', 'Score 70% or higher on final quiz'],
      completed: [true, false]
    },
    assessment: {
      name: 'Technical Interview Assessment',
      issued: null,
      available: false,
      prerequisites: ['Complete Assessment Test', 'Score 80% or higher'],
      completed: [false, false]
    }
  };

  const downloadCertificate = (type: 'course' | 'assessment') => {
    if (type === 'course') {
      setDownloadingCourse(true);
      // Simulate download
      setTimeout(() => {
        setDownloadingCourse(false);
      }, 2000);
    } else {
      setDownloadingAssessment(true);
      // Simulate download
      setTimeout(() => {
        setDownloadingAssessment(false);
      }, 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="mt-2 text-gray-600">
            View and download your earned certificates
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Course Completion Certificate */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">Course Completion Certificate</CardTitle>
                {certificates.course.available ? (
                  <Badge className="bg-green-500">Available</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                    In Progress
                  </Badge>
                )}
              </div>
              <CardDescription>
                Certifies completion of the Interview Mastery Course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-md p-6 mb-4 flex items-center justify-center">
                <div className="text-center">
                  <Award className="w-20 h-20 text-brand-purple mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">
                    {profile?.full_name || 'Student'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Has successfully completed
                  </p>
                  <p className="font-medium mt-2">{certificates.course.name}</p>
                  {certificates.course.issued && (
                    <p className="text-gray-500 text-sm mt-4">
                      Issued on {new Date(certificates.course.issued).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Requirements</h4>
                <ul className="space-y-2">
                  {certificates.course.prerequisites.map((req, index) => (
                    <li key={index} className="flex items-start">
                      {certificates.course.completed[index] ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                disabled={!certificates.course.available || downloadingCourse}
                onClick={() => downloadCertificate('course')}
              >
                {downloadingCourse ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Certificate
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Assessment Certificate */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">Assessment Certificate</CardTitle>
                {certificates.assessment.available ? (
                  <Badge className="bg-green-500">Available</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                    Locked
                  </Badge>
                )}
              </div>
              <CardDescription>
                Certifies successful completion of internship-level technical assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white border rounded-md p-6 mb-4 flex items-center justify-center border-dashed">
                <div className="text-center">
                  {certificates.assessment.available ? (
                    <>
                      <Award className="w-20 h-20 text-brand-purple mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">
                        {profile?.full_name || 'Student'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Has successfully completed
                      </p>
                      <p className="font-medium mt-2">{certificates.assessment.name}</p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-full border-2 border-gray-300 inline-block mb-4">
                        <LockIcon className="w-12 h-12 text-gray-300" />
                      </div>
                      <p className="text-gray-500">
                        Complete all requirements to unlock
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Requirements</h4>
                <ul className="space-y-2">
                  {certificates.assessment.prerequisites.map((req, index) => (
                    <li key={index} className="flex items-start">
                      {certificates.assessment.completed[index] ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full"
                disabled={!certificates.assessment.available || downloadingAssessment}
                onClick={() => downloadCertificate('assessment')}
              >
                {downloadingAssessment ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Certificate
                  </>
                )}
              </Button>
              
              {!certificates.assessment.available && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/learning'}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Take Assessment Test
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
