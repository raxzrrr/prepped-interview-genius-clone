
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Calendar, User, Award, FileText } from 'lucide-react';
import { useInterviewApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInterviewById, getAnswerFeedback } = useInterviewApi();
  const { toast } = useToast();
  const [interview, setInterview] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInterviewDetails();
    }
  }, [id]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      const interviewData = await getInterviewById(id!);
      
      if (!interviewData) {
        toast({
          title: "Interview not found",
          description: "The requested interview could not be found.",
          variant: "destructive",
        });
        navigate('/reports');
        return;
      }
      
      setInterview(interviewData);
      
      // Generate feedback for questions and answers if they exist
      if (interviewData.questions && interviewData.answers) {
        generateFeedback(interviewData.questions, interviewData.answers);
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
      toast({
        title: "Error",
        description: "Failed to load interview details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async (questions: string[], answers: string[]) => {
    setFeedbackLoading(true);
    try {
      const feedbackPromises = questions.map((question, index) => 
        getAnswerFeedback(question, answers[index] || 'No answer provided')
      );
      
      const feedbackResults = await Promise.all(feedbackPromises);
      setFeedback(feedbackResults.filter(f => f !== null));
    } catch (error) {
      console.error('Error generating feedback:', error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateEmotionData = () => {
    if (!interview?.facial_analysis || interview.facial_analysis.length === 0) {
      return { 
        primaryEmotion: 'neutral',
        confidenceAvg: 0,
        engagementAvg: 0 
      };
    }

    const emotionCounts: {[key: string]: number} = {};
    let totalConfidence = 0;
    let totalEngagement = 0;
    
    interview.facial_analysis.forEach((analysis: any) => {
      if (!analysis) return;
      
      const emotion = analysis.primary_emotion || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      
      totalConfidence += analysis.confidence_score || 0;
      totalEngagement += analysis.engagement_level || 0;
    });
    
    let primaryEmotion = 'neutral';
    let maxCount = 0;
    
    Object.keys(emotionCounts).forEach(emotion => {
      if (emotionCounts[emotion] > maxCount) {
        maxCount = emotionCounts[emotion];
        primaryEmotion = emotion;
      }
    });
    
    const confidenceAvg = Math.round(totalConfidence / interview.facial_analysis.length);
    const engagementAvg = Math.round(totalEngagement / interview.facial_analysis.length);
    
    return { primaryEmotion, confidenceAvg, engagementAvg };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading interview details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!interview) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Interview not found</h3>
          <p className="mt-2 text-gray-600">The requested interview could not be found.</p>
          <Button className="mt-4" onClick={() => navigate('/reports')}>
            Back to Reports
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const { primaryEmotion, confidenceAvg, engagementAvg } = calculateEmotionData();
  const questions = Array.isArray(interview.questions) ? interview.questions : [];
  const answers = Array.isArray(interview.answers) ? interview.answers : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/reports')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{interview.title}</h1>
              <p className="mt-2 text-gray-600">
                Interview completed on {formatDate(interview.created_at)}
              </p>
            </div>
          </div>
          <Badge variant={getScoreBadgeVariant(interview.score || 0)} className="text-lg px-3 py-1">
            {interview.score || 0}%
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {interview.duration ? `${Math.round(interview.duration / 60)} min` : 'N/A'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <User className="mr-2 h-4 w-4" />
                Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confidenceAvg}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Emotion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{primaryEmotion}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Content */}
        <Tabs defaultValue="questions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="facial">Facial Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            {questions.map((question: string, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{question}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your Answer:</h4>
                    <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                      {answers[index] || "No answer provided"}
                    </p>
                  </div>

                  {feedbackLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-purple mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Generating feedback...</p>
                    </div>
                  ) : feedback[index] && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">AI Feedback</h4>
                        <Badge variant={getScoreBadgeVariant(feedback[index].score)}>
                          {feedback[index].score}/100
                        </Badge>
                      </div>
                      
                      {feedback[index].strengths && feedback[index].strengths.length > 0 && (
                        <div className="mb-3">
                          <p className="font-medium text-green-600 mb-1">Strengths:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {feedback[index].strengths.map((strength: string, i: number) => (
                              <li key={i} className="text-gray-700">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {feedback[index].areas_to_improve && feedback[index].areas_to_improve.length > 0 && (
                        <div className="mb-3">
                          <p className="font-medium text-amber-600 mb-1">Areas to Improve:</p>
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {feedback[index].areas_to_improve.map((area: string, i: number) => (
                              <li key={i} className="text-gray-700">{area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {feedback[index].suggestion && (
                        <div>
                          <p className="font-medium text-blue-600 mb-1">Suggestion:</p>
                          <p className="text-sm text-gray-700">{feedback[index].suggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Performance</span>
                    <span>{interview.score || 0}%</span>
                  </div>
                  <Progress value={interview.score || 0} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Questions Answered</span>
                    <span>{answers.filter((a: string) => a?.trim()).length}/{questions.length}</span>
                  </div>
                  <Progress 
                    value={(answers.filter((a: string) => a?.trim()).length / questions.length) * 100} 
                    className="h-3" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Confidence Level</span>
                    <span>{confidenceAvg}%</span>
                  </div>
                  <Progress value={confidenceAvg} className="h-3" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Engagement Level</span>
                    <span>{engagementAvg}%</span>
                  </div>
                  <Progress value={engagementAvg} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facial">
            <Card>
              <CardHeader>
                <CardTitle>Facial Expression Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {interview.facial_analysis && interview.facial_analysis.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-brand-purple">{primaryEmotion}</div>
                        <p className="text-sm text-gray-600">Primary Emotion</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{confidenceAvg}%</div>
                        <p className="text-sm text-gray-600">Avg Confidence</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{engagementAvg}%</div>
                        <p className="text-sm text-gray-600">Avg Engagement</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {interview.facial_analysis.slice(0, 5).map((analysis: any, index: number) => (
                        analysis && analysis.observations ? (
                          <div key={index} className="bg-gray-50 p-4 rounded-md">
                            <h4 className="font-medium mb-2">Analysis for Question {index + 1}:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 text-sm">
                              <div>
                                <span className="font-medium">Emotion:</span> {analysis.primary_emotion || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Confidence:</span> {analysis.confidence_score || 0}%
                              </div>
                              <div>
                                <span className="font-medium">Engagement:</span> {analysis.engagement_level || 0}%
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Observations:</span>
                              <ul className="list-disc pl-5 mt-1">
                                {analysis.observations.slice(0, 3).map((obs: string, i: number) => (
                                  <li key={i} className="text-sm text-gray-700">{obs}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium">No facial analysis data</h3>
                    <p className="mt-2 text-gray-600">Facial analysis was not available for this interview.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ReportDetailPage;
