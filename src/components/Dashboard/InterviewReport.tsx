import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Download, Home, RotateCcw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { downloadInterviewReport, generateInterviewReportPDF } from '@/services/certificateService';
import { interviewService } from '@/services/interviewService';
import { useAuth } from '@/contexts/ClerkAuthContext';

interface InterviewReportProps {
  questions: string[];
  answers: string[];
  evaluations: any[];
  facialAnalysis?: any[];
  resumeAnalysis?: any;
  idealAnswers?: string[];
  interviewType?: string;
  onDone: () => void;
}

const InterviewReport: React.FC<InterviewReportProps> = ({
  questions,
  answers,
  evaluations,
  facialAnalysis = [],
  resumeAnalysis,
  idealAnswers = [],
  interviewType = 'basic_hr_technical',
  onDone
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const auth = useAuth();
  const savedRef = useRef(false);

  // Auto-save the report to user_reports when this report is shown
  useEffect(() => {
    if (savedRef.current) return;
    const saveReport = async () => {
      try {
        const userId = auth.getSupabaseUserId?.();
        if (!userId) return;

        // Compute average score locally to avoid ordering issues
        const avg = evaluations.length > 0
          ? evaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / evaluations.length
          : 0;
        const grade = avg >= 9 ? 'A+' : avg >= 8 ? 'A' : avg >= 7 ? 'B+' : avg >= 6 ? 'B' : avg >= 5 ? 'C+' : avg >= 4 ? 'C' : avg >= 3 ? 'D' : 'F';

        const reportData = {
          userName: auth.user?.fullName || 'Interview Candidate',
          interviewType: getInterviewTypeLabel(),
          completionDate: new Date().toLocaleDateString(),
          overallScore: avg,
          grade,
          totalQuestions: questions.length,
          questions,
          answers,
          evaluations,
          idealAnswers
        };
        const pdf = generateInterviewReportPDF(reportData);
        const pdfBlob = pdf.output('blob');
        const reportTitle = `${getInterviewTypeLabel()} - ${new Date().toLocaleDateString()}`;
        const metadata = {
          interview_type: interviewType,
          overall_score: avg,
          total_questions: questions.length,
          generated_at: new Date().toISOString()
        };
        await interviewService.saveInterviewReportPDF(userId, reportTitle, pdfBlob, metadata);
        savedRef.current = true;
      } catch (e) {
        // silent fail - user can still download manually
      }
    };
    saveReport();
  }, [auth.getSupabaseUserId, interviewType, questions, answers, evaluations, idealAnswers]);

  // Calculate overall performance from new evaluation format
  const averageScore = evaluations.length > 0 
    ? evaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / evaluations.length
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGradeFromScore = (score: number) => {
    if (score >= 9) return 'A+';
    if (score >= 8) return 'A';
    if (score >= 7) return 'B+';
    if (score >= 6) return 'B';
    if (score >= 5) return 'C+';
    if (score >= 4) return 'C';
    if (score >= 3) return 'D';
    return 'F';
  };

  const handleDownloadReport = async () => {
    try {
      const reportData = {
        userName: auth.user?.fullName || 'Interview Candidate',
        interviewType: getInterviewTypeLabel(),
        completionDate: new Date().toLocaleDateString(),
        overallScore: averageScore,
        grade: getGradeFromScore(averageScore),
        totalQuestions: questions.length,
        questions,
        answers,
        evaluations,
        idealAnswers
      };

      // Generate PDF
      const pdf = generateInterviewReportPDF(reportData);
      const pdfBlob = pdf.output('blob');
      
      // Download the PDF
      downloadInterviewReport(reportData);
      
      // Save to user_reports table if user is authenticated
      if (auth.user && auth.getSupabaseUserId) {
        const userId = auth.getSupabaseUserId();
        if (userId) {
          const reportTitle = `${getInterviewTypeLabel()} - ${new Date().toLocaleDateString()}`;
          const metadata = {
            interview_type: interviewType,
            overall_score: averageScore,
            total_questions: questions.length,
            generated_at: new Date().toISOString()
          };
          
          await interviewService.saveInterviewReportPDF(userId, reportTitle, pdfBlob, metadata);
          toast({
            title: "Report Downloaded",
            description: "Your interview report has been downloaded and saved to your profile!",
          });
        } else {
          toast({
            title: "Report Downloaded",
            description: "Your interview report has been downloaded successfully.",
          });
        }
      } else {
        toast({
          title: "Report Downloaded",
          description: "Your interview report has been downloaded successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getInterviewTypeLabel = () => {
    switch (interviewType) {
      case 'basic_hr_technical':
        return 'HR + Technical Interview';
      case 'role_based':
        return 'Role-Based Interview';
      case 'resume_based':
        return 'Resume-Based Interview';
      default:
        return 'Interview Report';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Interview Complete!</h1>
        <p className="text-gray-600">Here's your detailed performance analysis</p>
        <Badge variant="outline" className="text-sm">
          {getInterviewTypeLabel()}
        </Badge>
        
        <div className="flex items-center justify-center space-x-8">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}/10
            </div>
            <p className="text-sm text-gray-500">Overall Score</p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(averageScore)}`}>
              {getGradeFromScore(averageScore)}
            </div>
            <p className="text-sm text-gray-500">Grade</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{questions.length}</div>
            <p className="text-sm text-gray-500">Questions Answered</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {evaluations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {(evaluations.reduce((sum, evaluation) => sum + (evaluation.score_breakdown?.correctness || 0), 0) / evaluations.length).toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">Correctness</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-green-600">
                      {(evaluations.reduce((sum, evaluation) => sum + (evaluation.score_breakdown?.completeness || 0), 0) / evaluations.length).toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">Completeness</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-purple-600">
                      {(evaluations.reduce((sum, evaluation) => sum + (evaluation.score_breakdown?.depth || 0), 0) / evaluations.length).toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">Depth</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-orange-600">
                      {(evaluations.reduce((sum, evaluation) => sum + (evaluation.score_breakdown?.clarity || 0), 0) / evaluations.length).toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">Clarity</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>
                Professional-level evaluation based on industry standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Overall Performance</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={averageScore * 10} className="w-32" />
                    <Badge className={getScoreBadgeColor(averageScore)}>
                      {averageScore.toFixed(1)}/10
                    </Badge>
                  </div>
                </div>
                
                {evaluations.length > 0 && evaluations[0].remarks && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Key Insights</h4>
                    <p className="text-sm text-blue-800">
                      Based on your responses, focus on providing more specific examples and quantifiable results.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {questions.map((question, index) => {
            const evaluation = evaluations[index];
            const answer = answers[index] || 'No answer provided';
            const idealAnswer = idealAnswers[index];
            
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  <CardDescription>{question}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Your Answer:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {answer}
                    </p>
                  </div>
                  
                  {idealAnswer && (
                    <div>
                      <h4 className="font-medium mb-2">Ideal Answer:</h4>
                      <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
                        {idealAnswer}
                      </p>
                    </div>
                  )}
                  
                  {evaluation && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Score:</h4>
                        <Badge className={getScoreBadgeColor(evaluation.score || 0)}>
                          {evaluation.score || 0}/10
                        </Badge>
                      </div>
                      
                      {evaluation.score_breakdown && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.correctness || 0)}`}>
                              {evaluation.score_breakdown.correctness || 0}/10
                            </div>
                            <p className="text-xs text-gray-500">Correctness</p>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.completeness || 0)}`}>
                              {evaluation.score_breakdown.completeness || 0}/10
                            </div>
                            <p className="text-xs text-gray-500">Completeness</p>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.depth || 0)}`}>
                              {evaluation.score_breakdown.depth || 0}/10
                            </div>
                            <p className="text-xs text-gray-500">Depth</p>
                          </div>
                          <div className="text-center">
                            <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.clarity || 0)}`}>
                              {evaluation.score_breakdown.clarity || 0}/10
                            </div>
                            <p className="text-xs text-gray-500">Clarity</p>
                          </div>
                        </div>
                      )}
                      
                      {evaluation.remarks && (
                        <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                          <div className="flex">
                            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">{evaluation.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Recommendations</CardTitle>
              <CardDescription>
                Professional feedback to help you excel in future interviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-3">Strengths</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Completed all questions in the interview</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Demonstrated willingness to participate and learn</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Engaged with the interview process</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-700 mb-3">Areas to Improve</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Provide more detailed and specific examples</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Structure answers using the STAR method</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>Include quantifiable results and achievements</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">Next Steps</h4>
                <div className="space-y-2 text-sm text-purple-800">
                  <p>• Practice describing your projects with specific metrics and outcomes</p>
                  <p>• Prepare examples that demonstrate leadership and problem-solving skills</p>
                  <p>• Research common interview questions for your target role</p>
                  <p>• Practice mock interviews with peers or mentors</p>
                </div>
              </div>
              
              {resumeAnalysis && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Based on Your Resume</h4>
                  <p className="text-sm text-blue-800">
                    Your background in <strong>{resumeAnalysis.suggested_role}</strong> shows promise. 
                    Focus on highlighting your experience with {resumeAnalysis.skills?.slice(0, 2).join(' and ')} 
                    in future interviews and provide concrete examples of how you've applied these skills.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={handleDownloadReport} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Download Report</span>
        </Button>
        
        <Button variant="outline" onClick={onDone} className="flex items-center space-x-2">
          <RotateCcw className="h-4 w-4" />
          <span>Practice Again</span>
        </Button>
        
        <Button variant="outline" onClick={() => window.location.href = '/dashboard'} className="flex items-center space-x-2">
          <Home className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
    </div>
  );
};

export default InterviewReport;