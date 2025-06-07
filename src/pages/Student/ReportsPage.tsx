import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Eye, File, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generateConsistentUUID } from '@/utils/userUtils';
import { supabase } from '@/integrations/supabase/client';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { getInterviews } = useInterviewApi();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
    totalQuestions: 0
  });

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('Fetching reports for user:', user?.id);
      
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }

      // First try to get interviews using the API service
      try {
        const interviews = await getInterviews(user.id);
        console.log('Got interviews from API:', interviews?.length || 0);
        
        if (interviews && interviews.length > 0) {
          processInterviews(interviews);
          return;
        }
      } catch (apiError) {
        console.log('API service failed, trying direct Supabase query:', apiError);
      }

      // Fallback: Try direct Supabase query with generated UUID
      const supabaseUserId = generateConsistentUUID(user.id);
      console.log('Trying direct query with UUID:', supabaseUserId);
      
      const { data: directInterviews, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', supabaseUserId);
      
      if (error) {
        console.error('Direct Supabase query failed:', error);
      } else {
        console.log('Got interviews from direct query:', directInterviews?.length || 0);
        processInterviews(directInterviews || []);
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const processInterviews = (interviews: any[]) => {
    // Filter completed interviews and format for display
    const completedReports = interviews
      .filter(interview => interview.status === 'completed')
      .map(interview => ({
        id: interview.id,
        title: interview.title,
        date: new Date(interview.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        questions: Array.isArray(interview.questions) ? interview.questions.length : 0,
        duration: interview.duration ? `${Math.round(interview.duration / 60)} min` : 'N/A',
        score: interview.score || 0,
        answers: interview.answers,
        facial_analysis: interview.facial_analysis
      }));

    setReports(completedReports);

    // Calculate statistics
    const totalQuestions = interviews.reduce((acc, curr) => 
      acc + (Array.isArray(curr.questions) ? curr.questions.length : 0), 0);
    const avgScore = completedReports.length > 0 
      ? Math.round(completedReports.reduce((acc, curr) => acc + curr.score, 0) / completedReports.length) 
      : 0;

    setStats({
      totalInterviews: interviews.length,
      averageScore: avgScore,
      completedInterviews: completedReports.length,
      totalQuestions: totalQuestions
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="mt-2 text-gray-600">
            Access your interview performance reports and analytics
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInterviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedInterviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-purple">{stats.averageScore}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Clock className="mr-1 h-3 w-3" /> {report.date}
                    </CardDescription>
                  </div>
                  <Badge variant={getScoreBadgeVariant(report.score)}>
                    {report.score}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Questions</p>
                    <p className="font-medium">{report.questions}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">{report.duration}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Performance</span>
                    <span>{report.score}%</span>
                  </div>
                  <Progress value={report.score} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center"
                  onClick={() => {
                    window.location.href = `/reports/${report.id}`;
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {reports.length === 0 && !loading && (
          <div className="text-center py-12">
            <File className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No reports yet</h3>
            <p className="mt-2 text-gray-600">Complete your first interview to generate a report.</p>
            <Button className="mt-4" onClick={() => window.location.href = '/dashboard'}>
              Start Interview
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
