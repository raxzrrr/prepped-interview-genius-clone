
import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2 } from 'lucide-react';

const CertificatesPage: React.FC = () => {
  // Dummy data for certificates
  const certificates = [
    {
      id: '1',
      title: 'Technical Interview Mastery',
      issueDate: 'March 15, 2025',
      credentialId: 'TECH-INT-1234',
      imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=500&q=60'
    },
    {
      id: '2',
      title: 'Behavioral Interview Excellence',
      issueDate: 'February 28, 2025',
      credentialId: 'BEH-INT-5678',
      imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=60'
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
          <p className="mt-2 text-gray-600">
            View and download your earned certificates
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              </CardFooter>
            </Card>
          ))}
        </div>

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
