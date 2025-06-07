
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import CertificateCard from '@/components/Certificates/CertificateCard';
import CertificateViewer from '@/components/Certificates/CertificateViewer';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useLearningData } from '@/hooks/useLearningData';
import { Loader2, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Certificate {
  id: string;
  title: string;
  completedDate: string;
  score: number;
  certificateUrl?: string;
}

const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const { userLearningData, loading } = useLearningData(5); // 5 total modules
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  useEffect(() => {
    if (userLearningData) {
      generateCertificates();
    }
  }, [userLearningData]);

  const generateCertificates = () => {
    const certs: Certificate[] = [];
    
    // Check if course is completed and assessment is passed
    if (userLearningData?.course_completed_at && 
        userLearningData?.assessment_attempted && 
        userLearningData?.assessment_score && 
        userLearningData.assessment_score >= 80) {
      
      certs.push({
        id: `cert-${userLearningData.id}`,
        title: 'Interview Mastery Certificate',
        completedDate: new Date(userLearningData.assessment_completed_at || userLearningData.course_completed_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        score: userLearningData.assessment_score
      });
    }
    
    setCertificates(certs);
  };

  const handleDownload = async (certificate: Certificate) => {
    // Create a simple certificate as a downloadable HTML file
    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${certificate.title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate { 
            background: white; 
            padding: 60px; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center; 
            max-width: 800px;
            width: 100%;
          }
          .title { font-size: 36px; color: #333; margin-bottom: 20px; font-weight: bold; }
          .subtitle { font-size: 18px; color: #666; margin-bottom: 40px; }
          .name { font-size: 48px; color: #667eea; margin: 30px 0; font-weight: bold; }
          .course { font-size: 24px; color: #333; margin: 30px 0; }
          .details { display: flex; justify-content: space-around; margin: 40px 0; }
          .detail { text-align: center; }
          .detail-label { font-size: 14px; color: #888; }
          .detail-value { font-size: 18px; color: #333; font-weight: bold; }
          .seal { 
            width: 120px; 
            height: 120px; 
            background: #667eea; 
            border-radius: 50%; 
            margin: 40px auto; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 24px; 
            font-weight: bold;
          }
          .id { font-size: 12px; color: #888; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1 class="title">Certificate of Completion</h1>
          <p class="subtitle">This certifies that</p>
          <h2 class="name">${user?.firstName || ''} ${user?.lastName || ''}</h2>
          <p class="subtitle">has successfully completed</p>
          <h3 class="course">${certificate.title}</h3>
          <div class="details">
            <div class="detail">
              <div class="detail-label">Completion Date</div>
              <div class="detail-value">${certificate.completedDate}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Final Score</div>
              <div class="detail-value">${certificate.score}%</div>
            </div>
          </div>
          <div class="seal">✓<br>CERTIFIED</div>
          <p class="id">Certificate ID: ${certificate.id}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([certificateHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${certificate.title.replace(/\s+/g, '_')}_Certificate.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleView = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
  };

  const handleCloseViewer = () => {
    setSelectedCertificate(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading certificates...</span>
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
            View and download your earned certificates
          </p>
        </div>

        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onDownload={handleDownload}
                onView={handleView}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-gray-400" />
                <CardTitle className="text-gray-600">No Certificates Yet</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Complete the Interview Mastery Course and pass the assessment with a score of 80% or higher to earn your first certificate.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Complete all course modules</p>
                <p>• Take the technical assessment</p>
                <p>• Score 80% or higher</p>
                <p>• Download your certificate</p>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedCertificate && (
          <CertificateViewer
            certificate={selectedCertificate}
            userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student'}
            onClose={handleCloseViewer}
            onDownload={() => handleDownload(selectedCertificate)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
