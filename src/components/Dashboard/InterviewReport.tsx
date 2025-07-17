
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Download, Home, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { downloadCertificate } from '@/services/certificateService';

interface InterviewReportProps {
  questions: string[];
  answers: string[];
  evaluations: any[];
  facialAnalysis?: any[];
  resumeAnalysis?: any;
  onDone: () => void;
}

const InterviewReport: React.FC<InterviewReportProps> = ({
  questions,
  answers,
  evaluations,
  facialAnalysis = [],
  resumeAnalysis,
  onDone
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate overall performance
  const validEvaluations = evaluations.filter(eval => eval && eval.score_breakdown);
  const averageScore = validEvaluations.length > 0 
    ? validEvaluations.reduce((sum, eval) => sum + (eval.score_breakdown.overall || 0), 0) / validEvaluations.length
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

  const handleDownloadReport = () => {
    try {
      const reportData = {
        userName: 'Interview Candidate',
        certificateTitle: 'Interview Practice Completion',
        completionDate: new Date().toLocaleDateString(),
        score: Math.round(averageScore * 10),
        verificationCode: `INT-${Date.now().toString().slice(-8).toUpperCase()}`
      };

      downloadCertificate(reportData);
      
      toast({
        title: "Report Downloaded",
        description: "Your interview report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Interview Complete!</h1>
        <p className="text-gray-600">Here's your detailed performance analysis</p>
        
        <div className="flex items-center justify-center space-x-8">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>
              {(averageScore * 10).toFixed(1)}%
            </div>
            <p className="text-sm text-gray-500">Overall Score</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {validEvaluations.length > 0 && (
              <>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        {(validEvaluations.reduce((sum, eval) => sum + (eval.score_breakdown?.clarity || 0), 0) / validEvaluations.length).toFixed(1)}
                      </div>
                      <p className="text-sm text-gray-600">Clarity</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {(validEvaluations.reduce((sum, eval) => sum + (eval.score_breakdown?.relevance || 0), 0) / validEvaluations.length).toFixed(1)}
                      </div>
                      <p className="text-sm text-gray-600">Relevance</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-purple-600">
                        {(validEvaluations.reduce((sum, eval) => sum + (eval.score_breakdown?.depth || 0), 0) / validEvaluations.length).toFixed(1)}
                      </div>
                      <p className="text-sm text-gray-600">Depth</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-orange-600">
                        {(validEvaluations.reduce((sum, eval) => sum + (eval.score_breakdown?.examples || 0), 0) / validEvaluations.length).toFixed(1)}
                      </div>
                      <p className="text-sm text-gray-600">Examples</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>
                Based on AI analysis of your responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Overall Performance</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={averageScore * 10} className="w-32" />
                    <Badge className={getScoreBadgeColor(averageScore)}>
                      {(averageScore * 10).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                    <ul className="space-y-1 text-sm">
                      {validEvaluations.length > 0 ? (
                        validEvaluations.slice(0, 3).map((eval, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Good response structure and clarity</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Analysis not available</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1 text-sm">
                      {validEvaluations.length > 0 ? (
                        validEvaluations.slice(0, 3).map((eval, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>Add more specific examples</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Analysis not available</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {questions.map((question, index) => {
            const evaluation = evaluations[index];
            const answer = answers[index] || 'No answer provided';
            
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
                  
                  {evaluation && evaluation.score_breakdown && (
                    <div className="space-y-3">
                      <h4 className="font-medium">AI Evaluation:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.clarity || 0)}`}>
                            {evaluation.score_breakdown.clarity || 0}/10
                          </div>
                          <p className="text-xs text-gray-500">Clarity</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.relevance || 0)}`}>
                            {evaluation.score_breakdown.relevance || 0}/10
                          </div>
                          <p className="text-xs text-gray-500">Relevance</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.depth || 0)}`}>
                            {evaluation.score_breakdown.depth || 0}/10
                          </div>
                          <p className="text-xs text-gray-500">Depth</p>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(evaluation.score_breakdown.examples || 0)}`}>
                            {evaluation.score_breakdown.examples || 0}/10
                          </div>
                          <p className="text-xs text-gray-500">Examples</p>
                        </div>
                      </div>
                      
                      {evaluation.feedback && (
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-sm">{evaluation.feedback}</p>
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
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>
                Based on your performance and resume analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-700 mb-3">Keep Doing</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Your communication style is clear and professional</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Good job structuring your responses</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>You demonstrate good understanding of concepts</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-700 mb-3">Areas to Focus On</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <div className="h-4 w-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                      <span>Include more specific examples from your experience</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="h-4 w-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                      <span>Quantify your achievements when possible</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="h-4 w-4 bg-blue-500 rounded-full flex-shrink-0 mt-0.5"></div>
                      <span>Practice the STAR method for behavioral questions</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {resumeAnalysis && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-700 mb-2">Based on Your Resume</h4>
                  <p className="text-sm text-purple-600">
                    Your background in <strong>{resumeAnalysis.suggested_role}</strong> is strong. 
                    Focus on highlighting your experience with {resumeAnalysis.skills?.slice(0, 2).join(' and ')} 
                    in future interviews.
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
