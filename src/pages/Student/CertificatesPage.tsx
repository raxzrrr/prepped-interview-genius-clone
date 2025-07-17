
import React, { useState } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CertificateCard from '@/components/Certificates/CertificateCard';
import CertificateViewer from '@/components/Certificates/CertificateViewer';
import { Award, Download, Eye, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useCertificates } from '@/hooks/useCertificates';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { downloadCertificate } from '@/services/certificateService';

const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const { userCertificates, availableCertificates, loading } = useCertificates();
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleDownload = (certificate: any) => {
    const userName = user?.fullName || user?.firstName || 'Student';
    downloadCertificate({
      userName,
      certificateTitle: certificate.certificates.title,
      completionDate: new Date(certificate.issued_date).toLocaleDateString(),
      score: certificate.completion_data?.score,
      verificationCode: certificate.verification_code
    });
  };

  const handleView = (certificate: any) => {
    setSelectedCertificate(certificate);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
            <p className="text-muted-foreground mt-1">
              Your achievements and completed certifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <span className="font-semibold">{userCertificates.length} Earned</span>
          </div>
        </div>

        {/* Earned Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Earned Certificates
            </CardTitle>
            <CardDescription>
              Certificates you have successfully earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userCertificates.map((cert) => (
                  <Card key={cert.id} className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">Earned</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(cert)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(cert)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-lg mb-2">
                        {cert.certificates.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {cert.certificates.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(cert.issued_date).toLocaleDateString()}</span>
                        </div>
                        {cert.completion_data?.score && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {cert.completion_data.score}%
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        ID: {cert.verification_code}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No certificates earned yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete interviews and courses to earn your first certificate!
                </p>
                <Button onClick={() => window.location.href = '/interviews'}>
                  Start Practicing
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Available Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Available Certificates
            </CardTitle>
            <CardDescription>
              Certificates you can earn by meeting the requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCertificates.map((cert) => {
                const isEarned = userCertificates.some(uc => uc.certificate_id === cert.id);
                
                return (
                  <Card 
                    key={cert.id} 
                    className={isEarned ? "border-green-200 bg-green-50/30" : "border-blue-200 bg-blue-50/30"}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Award className={`h-5 w-5 ${isEarned ? 'text-green-600' : 'text-blue-600'}`} />
                          <Badge 
                            variant="outline" 
                            className={isEarned 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-blue-100 text-blue-800 border-blue-200"
                            }
                          >
                            {isEarned ? 'Earned' : 'Available'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-lg mb-2">{cert.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {cert.description}
                      </p>
                      
                      {/* Requirements */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Requirements:</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {cert.requirements?.min_interviews && (
                            <div>• Complete {cert.requirements.min_interviews} interviews</div>
                          )}
                          {cert.requirements?.min_score && (
                            <div>• Achieve {cert.requirements.min_score}% average score</div>
                          )}
                          {cert.requirements?.admin_approval && (
                            <div>• Admin approval required</div>
                          )}
                          {cert.requirements?.min_average_score && (
                            <div>• Maintain {cert.requirements.min_average_score}% average</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Viewer Modal */}
      {viewerOpen && selectedCertificate && (
        <CertificateViewer
          certificate={{
            id: selectedCertificate.verification_code,
            title: selectedCertificate.certificates.title,
            completedDate: new Date(selectedCertificate.issued_date).toLocaleDateString(),
            score: selectedCertificate.completion_data?.score || 0
          }}
          userName={user?.fullName || user?.firstName || 'Student'}
          onClose={() => setViewerOpen(false)}
          onDownload={() => handleDownload(selectedCertificate)}
        />
      )}
    </DashboardLayout>
  );
};

export default CertificatesPage;
