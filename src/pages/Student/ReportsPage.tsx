
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Play } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserReport {
  id: string;
  title: string;
  created_at: string;
  pdf_url: string | null;
  pdf_data: string | null;
  metadata: any;
}

const ReportsPage: React.FC = () => {
  const { user, isStudent, getSupabaseUserId } = useAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in or not a student
  if (!user || !isStudent()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const uid = getSupabaseUserId();
        if (!uid) return;
        const { data, error } = await supabase
          .from('user_reports')
          .select('id, title, created_at, pdf_url, pdf_data, metadata')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setReports((data || []) as UserReport[]);
      } catch (e) {
        console.error('Failed to load reports', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [getSupabaseUserId]);

  const handleDownload = (report: UserReport) => {
    if (report.pdf_url) {
      window.open(report.pdf_url, '_blank');
      return;
    }
    if (report.pdf_data) {
      try {
        const byteCharacters = atob(report.pdf_data);
        const byteNumbers = new Array(byteCharacters.length)
          .fill(0)
          .map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.title.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Failed to download PDF', e);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-2 text-gray-600">
            Download your interview reports after completing sessions
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-600">Loading...</CardContent>
          </Card>
        ) : reports.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5 text-brand-purple" />
                Interview Reports
              </CardTitle>
              <CardDescription>
                Generate and download detailed reports from your interview sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-4">No Saved Reports</h3>
              <div className="max-w-md mx-auto mb-6">
                <p className="text-gray-600 mb-4">
                  Reports are generated after each interview session and can be downloaded immediately. 
                  Reports include your questions, answers, AI feedback, and performance analysis.
                </p>
                <p className="text-sm text-gray-500">
                  Reports are not stored permanently - make sure to download them after each interview.
                </p>
              </div>
              <Button onClick={() => (window.location.href = '/custom-interviews')} className="w-full max-w-sm">
                <Play className="mr-2 h-4 w-4" />
                Start Interview to Generate Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    {r.title}
                  </CardTitle>
                  <CardDescription>{new Date(r.created_at).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Button size="sm" onClick={() => handleDownload(r)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
