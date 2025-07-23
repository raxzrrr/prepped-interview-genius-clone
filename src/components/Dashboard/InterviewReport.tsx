
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

  // Calculate overall performance - handle both old and new evaluation formats
  const batchEvaluation = evaluations[0];
  const isBatchEvaluation = batchEvaluation && batchEvaluation.overallScore !== undefined;
  
  const averageScore = isBatchEvaluation 
    ? batchEvaluation.overallScore / 100  // Convert percentage to 0-1 scale
    : evaluations.filter(evaluation => evaluation && evaluation.score_breakdown).length > 0 
      ? evaluations.filter(evaluation => evaluation && evaluation.score_breakdown)
          .reduce((sum, evaluation) => sum + (evaluation.score_breakdown.overall || 0), 0) / 
          evaluations.filter(evaluation => evaluation && evaluation.score_breakdown).length
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
          {isBatchEvaluation ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className={`text-3xl font-bold ${batchEvaluation.overallScore >= 80 ? 'text-green-600' : batchEvaluation.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {batchEvaluation.overallGrade}
                    </div>
                    <p className="text-sm text-gray-600">Overall Grade</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className={`text-2xl font-bold ${batchEvaluation.recommendation === 'HIRE' ? 'text-green-600' : batchEvaluation.recommendation === 'MAYBE' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {batchEvaluation.recommendation}
                    </div>
                    <p className="text-sm text-gray-600">Recommendation</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {batchEvaluation.questionEvaluations?.filter(q => q.result === 'PASS').length || 0}/{questions.length}
                    </div>
                    <p className="text-sm text-gray-600">Questions Passed</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl font-bold text-gray-500">N/A</div>
                    <p className="text-sm text-gray-600">Individual Scoring</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
                      {isBatchEvaluation && batchEvaluation.strengths ? (
                        batchEvaluation.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500">Analysis not available</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Critical Weaknesses</h4>
                    <ul className="space-y-1 text-sm">
                      {isBatchEvaluation && batchEvaluation.criticalWeaknesses ? (
                        batchEvaluation.criticalWeaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{weakness}</span>
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
            const answer = answers[index] || 'No answer provided';
            const questionEval = isBatchEvaluation 
              ? batchEvaluation.questionEvaluations?.find(q => q.questionNumber === index + 1)
              : evaluations[index];
            
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                      <CardDescription>{question}</CardDescription>
                    </div>
                    {questionEval && questionEval.result && (
                      <Badge className={questionEval.result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {questionEval.result}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Your Answer:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {answer}
                    </p>
                  </div>
                  
                  {questionEval && questionEval.expectedAnswer && (
                    <div>
                      <h4 className="font-medium mb-2">Expected Answer:</h4>
                      <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                        {questionEval.expectedAnswer}
                      </p>
                    </div>
                  )}
                  
                  {questionEval && (questionEval.score || questionEval.feedback) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Professional Evaluation:</h4>
                        {questionEval.score && (
                          <div className={`text-lg font-bold ${getScoreColor(questionEval.score)}`}>
                            {questionEval.score}/10
                          </div>
                        )}
                      </div>
                      
                      {questionEval.feedback && (
                        <div className={`p-3 rounded ${questionEval.result === 'FAIL' ? 'bg-red-50 border border-red-200' : 'bg-blue-50'}`}>
                          <p className="text-sm font-medium mb-1">Feedback:</p>
                          <p className="text-sm">{questionEval.feedback}</p>
                        </div>
                      )}
                      
                      {questionEval.improvements && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                          <p className="text-sm font-medium mb-1">How to Improve:</p>
                          <p className="text-sm">{questionEval.improvements}</p>
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
          {isBatchEvaluation && (
            <>
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700">Industry Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-red-700">{batchEvaluation.industryComparison}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Action Plan</CardTitle>
                  <CardDescription>Specific steps to improve your interview performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">{batchEvaluation.actionPlan}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-green-700 mb-3">Your Strengths</h4>
                      <ul className="space-y-2 text-sm">
                        {batchEvaluation.strengths?.map((strength, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-red-700 mb-3">Critical Areas to Fix</h4>
                      <ul className="space-y-2 text-sm">
                        {batchEvaluation.criticalWeaknesses?.map((weakness, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {resumeAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>Resume-Based Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-700 mb-2">Based on Your Resume</h4>
                  <p className="text-sm text-purple-600">
                    Your background in <strong>{resumeAnalysis.suggested_role}</strong> is strong. 
                    Focus on highlighting your experience with {resumeAnalysis.skills?.slice(0, 2).join(' and ')} 
                    in future interviews.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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
