
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DashboardAnalytics from '@/components/Dashboard/DashboardAnalytics';
import { 
  Play, 
  BookOpen, 
  Award, 
  FileText, 
  TrendingUp,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useInterviewUsage } from '@/hooks/useInterviewUsage';
import { useCertificates } from '@/hooks/useCertificates';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { hasProPlan } = useSubscription();
  const { canUseFreeInterview, usage } = useInterviewUsage();
  const { userCertificates } = useCertificates();
  
  const isPro = hasProPlan();
  const canStartInterview = isPro || canUseFreeInterview();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
            <p className="text-muted-foreground mt-1">
              Ready to ace your next interview? Let's practice together.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isPro && (
              <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                {canUseFreeInterview() ? '1 Free Interview Available' : 'Free Trial Used'}
              </Badge>
            )}
            {isPro && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Zap className="w-3 h-3 mr-1" />
                PRO Member
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/interviews')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="h-5 w-5 text-blue-600" />
                </div>
                {canStartInterview && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Available
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Start Interview</CardTitle>
              <CardDescription>
                {canStartInterview 
                  ? "Practice with AI-powered mock interviews"
                  : "Upgrade to Pro for unlimited interviews"
                }
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/learning')}>
            <CardHeader className="pb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Learning Hub</CardTitle>
              <CardDescription>
                Access courses and improve your skills
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/certificates')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                {userCertificates.length > 0 && (
                  <Badge variant="outline">
                    {userCertificates.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Certificates</CardTitle>
              <CardDescription>
                View your earned certificates and achievements
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/reports')}>
            <CardHeader className="pb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Interview Reports</CardTitle>
              <CardDescription>
                View detailed reports and track your progress
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Dashboard */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Your Progress</h2>
          </div>
          <DashboardAnalytics 
            interviewCount={usage?.usage_count || 0}
            certificateCount={userCertificates.length}
          />
        </div>

        {/* Recent Activity & Quick Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usage?.last_interview_date ? (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Last Interview Session</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(usage.last_interview_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">Completed</Badge>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Play className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No interviews completed yet</p>
                    <p className="text-sm">Start your first practice session!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium text-blue-900">Practice regularly</p>
                  <p className="text-sm text-blue-700">Consistent practice leads to better performance</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="font-medium text-green-900">Review feedback</p>
                  <p className="text-sm text-green-700">Learn from AI suggestions to improve faster</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <p className="font-medium text-purple-900">Stay confident</p>
                  <p className="text-sm text-purple-700">Confidence is key to interview success</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
