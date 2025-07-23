import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useInterviewReports } from '@/hooks/useInterviewReports';
import { useToast } from '@/components/ui/use-toast';
import { downloadCertificate } from '@/services/certificateService';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { reports, loading, deleteReport } = useInterviewReports();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter(report => 
    report.timestamp.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.overallGrade?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.recommendation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadPDF = async (report: any) => {
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

  const handleDeleteReport = (reportId: string) => {
    deleteReport(reportId);
    toast({
      title: "Report Deleted",
      description: "Interview report has been removed.",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (grade: string) => {
    if (['A+', 'A'].includes(grade)) return 'bg-green-100 text-green-800';
    if (['B+', 'B'].includes(grade)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = (recommendation: string) => {
    if (recommendation === 'HIRE') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (recommendation === 'MAYBE') return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Interview Reports</h1>
            <p className="text-muted-foreground mt-1">
              Review your interview performance and track your progress
            </p>
          </div>
          <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700">
            {reports.length} Reports Available
          </Badge>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reports by date, grade, or recommendation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-600 mb-6">
                {reports.length === 0 
                  ? "You haven't completed any interviews yet. Start practicing to generate your first report!"
                  : "No reports match your search criteria."
                }
              </p>
              {reports.length === 0 && (
                <Button onClick={() => navigate('/interviews')}>
                  Start Your First Interview
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Interview Report
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(report.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.overallScore && (
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                            {report.overallScore}%
                          </div>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      )}
                      {report.overallGrade && (
                        <Badge className={getScoreBadgeColor(report.overallGrade)}>
                          Grade {report.overallGrade}
                        </Badge>
                      )}
                      {report.recommendation && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(report.recommendation)}
                          <span className="text-sm font-medium">
                            {report.recommendation}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{report.questions?.length || 0} Questions</span>
                      <span>•</span>
                      <span>{report.answers?.length || 0} Answers</span>
                      {report.evaluations && report.evaluations.length > 0 && (
                        <>
                          <span>•</span>
                          <span>AI Evaluated</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/report-detail/${report.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(report)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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