
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, Download, Calendar, User, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const { getInterviews } = useInterviewApi();
  const { toast } = useToast();
  const [eligibleInterviews, setEligibleInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCerts, setGeneratingCerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchEligibleInterviews();
    }
  }, [user]);

  const fetchEligibleInterviews = async () => {
    try {
      setLoading(true);
      const interviews = await getInterviews(user?.id || '');
      
      // Filter interviews that are eligible for certificates (score >= 80 and completed)
      const eligible = interviews
        .filter(interview => 
          interview.status === 'completed' && 
          interview.score && 
          interview.score >= 80
        )
        .map(interview => ({
          id: interview.id,
          title: interview.title,
          date: new Date(interview.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          score: interview.score,
          questions: Array.isArray(interview.questions) ? interview.questions.length : 0
        }));

      setEligibleInterviews(eligible);
    } catch (error) {
      console.error('Error fetching eligible interviews:', error);
      toast({
        title: "Error",
        description: "Failed to load certificate data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (interview: any) => {
    if (!user) return;

    setGeneratingCerts(prev => new Set(prev).add(interview.id));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: {
          type: 'interview-completion',
          userId: user.id,
          userName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User',
          courseName: interview.title,
          certId: `CERT-${interview.id.slice(0, 8).toUpperCase()}`,
          issueDate: new Date().toISOString()
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.pdfBase64) {
        // Create download link
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${interview.title.replace(/\s+/g, '_')}_Certificate.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Certificate Generated",
          description: "Your certificate has been downloaded successfully!",
        });
      }
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate certificate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingCerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(interview.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading certificates...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-2 text-gray-600">
            Download certificates for your completed interviews with scores of 80% or higher
          </p>
        </div>

        {/* Certificate Eligibility Info */}
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <Trophy className="mr-2 h-5 w-5" />
              Certificate Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center text-amber-700">
                <Award className="mr-2 h-4 w-4" />
                Score 80% or higher
              </div>
              <div className="flex items-center text-amber-700">
                <User className="mr-2 h-4 w-4" />
                Complete all questions
              </div>
              <div className="flex items-center text-amber-700">
                <Calendar className="mr-2 h-4 w-4" />
                Valid interview session
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eligible Certificates */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eligibleInterviews.map((interview) => (
            <Card key={interview.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{interview.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="mr-1 h-3 w-3" /> {interview.date}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    {interview.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Questions</p>
                    <p className="font-medium">{interview.questions}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Grade</p>
                    <p className="font-medium text-green-600">Excellent</p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Certificate ID:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    CERT-{interview.id.slice(0, 8).toUpperCase()}
                  </code>
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <Button 
                  onClick={() => generateCertificate(interview)}
                  disabled={generatingCerts.has(interview.id)}
                  className="w-full"
                >
                  {generatingCerts.has(interview.id) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Certificate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Certificates Available */}
        {eligibleInterviews.length === 0 && !loading && (
          <div className="text-center py-12">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No certificates available</h3>
            <p className="mt-2 text-gray-600">
              Complete interviews with a score of 80% or higher to earn certificates.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/dashboard'}>
              Start Interview
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CertificatesPage;
