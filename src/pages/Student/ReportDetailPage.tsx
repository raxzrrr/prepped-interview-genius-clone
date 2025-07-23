import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { useInterviewReports } from '@/hooks/useInterviewReports';
import InterviewReport from '@/components/Dashboard/InterviewReport';
import { useToast } from '@/components/ui/use-toast';
import { downloadCertificate } from '@/services/certificateService';

const ReportDetailPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { getReportById } = useInterviewReports();
  const { toast } = useToast();

  const report = reportId ? getReportById(reportId) : null;

  const handleDownloadPDF = async () => {
    if (!report) return;
    
    try {
      const reportData = {
        userName: 'Interview Candidate',
        certificateTitle: `Interview Report - ${report.overallGrade}`,
        completionDate: new Date(report.timestamp).toLocaleDateString(),
        score: report.overallScore || 0,
        verificationCode: report.id.slice(-8).toUpperCase()
      };

      await downloadCertificate(reportData);
      
      toast({
        title: "Report Downloaded",
        description: "Your interview report has been downloaded as PDF.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <p className="text-gray-600 mb-6">The requested interview report could not be found.</p>
          <Button onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/reports')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Report Content */}
        <InterviewReport
          questions={report.questions}
          answers={report.answers}
          evaluations={report.evaluations}
          facialAnalysis={[]}
          interviewType={report.interviewType}
          jobRole={report.jobRole}
          resumeAnalysis={report.reportData?.resumeAnalysis}
          onDone={() => navigate('/reports')}
        />
      </div>
    </DashboardLayout>
  );
};

export default ReportDetailPage;