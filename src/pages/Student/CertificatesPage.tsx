
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Award, CheckCircle, XCircle, BookOpen, LockIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Certificate {
  id: string;
  name: string;
  issued: string | null;
  available: boolean;
  prerequisites: string[];
  completed: boolean[];
}

// Define an interface for user learning data
interface UserLearningData {
  id: string;
  user_id: string;
  course_progress: any;
  completed_modules: number;
  total_modules: number;
  course_score: number | null;
  course_completed_at: string | null;
  assessment_attempted: boolean;
  assessment_score: number | null;
  assessment_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const CertificatesPage: React.FC = () => {
  const { user, isStudent, profile } = useAuth();
  const [downloadingCourse, setDownloadingCourse] = useState(false);
  const [downloadingAssessment, setDownloadingAssessment] = useState(false);
  const [certificates, setCertificates] = useState<{
    course: Certificate;
    assessment: Certificate;
  }>({
    course: {
      id: 'course-cert',
      name: 'Interview Mastery Course',
      issued: null,
      available: false,
      prerequisites: ['Complete all course modules', 'Score 70% or higher on final quiz'],
      completed: [false, false]
    },
    assessment: {
      id: 'assessment-cert',
      name: 'Technical Interview Assessment',
      issued: null,
      available: false,
      prerequisites: ['Complete Assessment Test', 'Score 80% or higher'],
      completed: [false, false]
    }
  });
  const { toast } = useToast();
  
  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }
  
  // Fetch user certificates data
  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);
  
  const fetchCertificates = async () => {
    try {
      // Get user's learning progress from the database
      const { data: learningData, error } = await supabase
        .from('user_learning')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      // If we have learning data, update certificates
      if (learningData) {
        const typedData = learningData as UserLearningData;
        
        setCertificates({
          course: {
            id: 'course-cert',
            name: 'Interview Mastery Course',
            issued: typedData.course_completed_at,
            available: !!typedData.course_completed_at,
            prerequisites: ['Complete all course modules', 'Score 70% or higher on final quiz'],
            completed: [
              typedData.completed_modules >= (typedData.total_modules || 8),
              (typedData.course_score || 0) >= 70
            ]
          },
          assessment: {
            id: 'assessment-cert',
            name: 'Technical Interview Assessment',
            issued: typedData.assessment_completed_at,
            available: !!typedData.assessment_completed_at,
            prerequisites: ['Complete Assessment Test', 'Score 80% or higher'],
            completed: [
              !!typedData.assessment_attempted,
              (typedData.assessment_score || 0) >= 80
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const downloadCertificate = async (type: 'course' | 'assessment') => {
    if (type === 'course') {
      setDownloadingCourse(true);
      try {
        // Generate PDF certificate on the server
        const { data, error } = await supabase.functions.invoke('generate-certificate', {
          body: { 
            type: 'course',
            userId: user?.id,
            userName: profile?.full_name || 'Student',
            courseName: certificates.course.name,
            certId: certificates.course.id,
            issueDate: certificates.course.issued || new Date().toISOString()
          }
        });
        
        if (error) throw new Error(error.message);
        
        if (data?.pdfBase64) {
          // Create a download link for the PDF
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${data.pdfBase64}`;
          link.download = `Course_Certificate_${certificates.course.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Certificate Downloaded",
            description: "Your certificate has been downloaded successfully."
          });
        }
      } catch (error) {
        console.error('Error downloading certificate:', error);
        toast({
          title: "Download Failed",
          description: "Failed to download certificate. Please try again.",
          variant: "destructive"
        });
      } finally {
        setDownloadingCourse(false);
      }
    } else {
      setDownloadingAssessment(true);
      try {
        // Generate PDF certificate on the server
        const { data, error } = await supabase.functions.invoke('generate-certificate', {
          body: { 
            type: 'assessment',
            userId: user?.id,
            userName: profile?.full_name || 'Student',
            courseName: certificates.assessment.name,
            certId: certificates.assessment.id,
            issueDate: certificates.assessment.issued || new Date().toISOString()
          }
        });
        
        if (error) throw new Error(error.message);
        
        if (data?.pdfBase64) {
          // Create a download link for the PDF
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${data.pdfBase64}`;
          link.download = `Assessment_Certificate_${certificates.assessment.id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Certificate Downloaded",
            description: "Your certificate has been downloaded successfully."
          });
        }
      } catch (error) {
        console.error('Error downloading certificate:', error);
        toast({
          title: "Download Failed",
          description: "Failed to download certificate. Please try again.",
          variant: "destructive"
        });
      } finally {
        setDownloadingAssessment(false);
      }
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
                      {certificates.assessment.issued && (
                        <p className="text-gray-500 text-sm mt-4">
                          Issued on {new Date(certificates.assessment.issued).toLocaleDateString()}
                        </p>
                      )}
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
