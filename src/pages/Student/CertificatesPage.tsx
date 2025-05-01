
import React, { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [showTestDialog, setShowTestDialog] = useState(false);
  
  // Dummy data for certificates
  const certificates = [
    {
      id: '1',
      title: 'Course Completion Certificate',
      description: 'Certificate of completing the Interview Preparation course',
      issueDate: 'April 20, 2025',
      credentialId: 'COURSE-COMP-1234',
      imageUrl: 'https://images.unsplash.com/photo-1569017388730-020b5f80a004?auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '2',
      title: 'Assessment Certificate',
      description: 'Certificate of passing the internship-level assessment',
      issueDate: 'May 15, 2025',
      credentialId: 'ASSESS-INT-5678',
      imageUrl: 'https://images.unsplash.com/photo-1580894894513-541e068a3e2b?auto=format&fit=crop&w=500&q=60',
      requiresTest: true,
      completed: false
    }
  ];

  const handleDownloadCertificate = (id: string) => {
    console.log(`Downloading certificate with ID: ${id}`);
    // This would trigger the PDF download
  };

  const handleShareCertificate = (id: string) => {
    console.log(`Sharing certificate with ID: ${id}`);
    // This would open a share dialog
  };

  const startAssessmentTest = () => {
    setShowTestDialog(true);
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
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  {certificate.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-[4/3] rounded-md overflow-hidden mb-4">
                  <img 
                    src={certificate.imageUrl} 
                    alt={certificate.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  {certificate.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Issued On</span>
                    <span>{certificate.issueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Credential ID</span>
                    <span className="font-mono">{certificate.credentialId}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                {certificate.requiresTest && !certificate.completed ? (
                  <Button 
                    variant="default"
                    onClick={startAssessmentTest}
                    className="w-full"
                  >
                    Take Assessment Test
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center" 
                      onClick={() => handleDownloadCertificate(certificate.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center" 
                      onClick={() => handleShareCertificate(certificate.id)}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assessment Test</DialogTitle>
              <DialogDescription>
                Take this test to earn your Assessment Certificate. You need to pass an MSQ test that validates internship-level skills.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <p className="text-sm text-gray-600">
                This multiple-choice assessment contains 30 questions covering various technical and soft skills topics relevant for internship positions. You'll have 45 minutes to complete the test.
              </p>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> 
                <p className="text-sm">You can pause and resume the test as needed</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> 
                <p className="text-sm">A score of 70% or higher is required to pass</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> 
                <p className="text-sm">Upon completion, your certificate will be issued immediately</p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTestDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Start Assessment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {certificates.length === 0 && (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No certificates yet</h3>
            <p className="mt-2 text-gray-600">Complete courses to earn certificates.</p>
            <Button className="mt-4">Browse Courses</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
