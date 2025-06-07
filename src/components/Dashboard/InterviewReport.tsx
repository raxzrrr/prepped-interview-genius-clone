import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Download, RefreshCw, Save, Share2 } from 'lucide-react';
import { useInterviewApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { generateConsistentUUID } from '@/utils/userUtils';
import { supabase } from '@/integrations/supabase/client';

export interface InterviewReportProps {
  questions: string[];
  answers: string[];
  facialAnalysis?: any[];
  onDone: () => void;
  interviewId?: string;
}

const InterviewReport: React.FC<InterviewReportProps> = ({ 
  questions, 
  answers, 
  facialAnalysis = [], 
  onDone,
  interviewId 
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const { getAnswerFeedback, updateInterview } = useInterviewApi();
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    if (questions.length > 0 && answers.length > 0) {
      analyzeAnswers();
    }
  }, [questions, answers]);

  useEffect(() => {
    if (feedback.length > 0 && overallScore > 0 && !reportSaved) {
      saveReportToDatabase();
    }
  }, [feedback, overallScore, reportSaved]);

  const analyzeAnswers = async () => {
    setLoading(true);
    
    try {
      // Analyze each answer and get feedback
      const feedbackPromises = questions.map((question, index) => 
        getAnswerFeedback(question, answers[index] || 'No answer provided')
      );
      
      // Wait for all feedback to be processed
      const feedbackResults = await Promise.all(feedbackPromises);
      
      // Filter out null values and calculate average score
      const validFeedback = feedbackResults.filter(f => f !== null);
      setFeedback(validFeedback);
      
      if (validFeedback.length > 0) {
        const totalScore = validFeedback.reduce((sum, f) => sum + (f.score || 0), 0);
        setOverallScore(Math.round(totalScore / validFeedback.length));
      }
      
    } catch (error) {
      console.error('Error analyzing answers:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReportToDatabase = async () => {
    if (!user || !interviewId) return;
    
    try {
      console.log('Saving interview report to database...');
      
      // Calculate duration (estimate based on number of questions)
      const estimatedDuration = questions.length * 2; // 2 minutes per question average
      
      // Update the interview with completion data
      await updateInterview(interviewId, {
        status: 'completed',
        answers: answers,
        score: overallScore,
        duration: estimatedDuration,
        facial_analysis: facialAnalysis,
        completed_at: new Date().toISOString()
      });
      
      setReportSaved(true);
      console.log('Interview report saved successfully');
      
    } catch (error) {
      console.error('Error saving report to database:', error);
      toast({
        title: "Save Warning",
        description: "Report generated but not saved to database. You can still download it.",
        variant: "destructive",
      });
    }
  };

  const handleSaveReport = async () => {
    try {
      setIsSaving(true);
      
      // Create report data
      const reportData = {
        questions,
        answers,
        feedback,
        overallScore,
        facialAnalysis,
        generatedAt: new Date().toISOString(),
        interviewId
      };
      
      // Save as JSON file
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Saved",
        description: "Your interview report has been downloaded as JSON.",
      });
      
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      
      // Create a more comprehensive HTML document for PDF conversion
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Interview Report</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 2px solid #6366f1;
              padding-bottom: 20px;
            }
            .score { 
              font-size: 32px; 
              font-weight: bold; 
              color: #6366f1; 
              margin: 10px 0;
            }
            .section { 
              margin-bottom: 30px; 
              break-inside: avoid;
            }
            .question { 
              font-weight: bold; 
              margin-bottom: 10px; 
              color: #1f2937;
              font-size: 16px;
            }
            .answer { 
              margin-bottom: 15px; 
              padding: 15px; 
              background-color: #f8fafc; 
              border-left: 4px solid #6366f1;
              border-radius: 4px;
            }
            .feedback { 
              margin-bottom: 15px; 
              padding: 15px;
              background-color: #fefefe;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
            }
            .strengths { 
              color: #16a34a; 
              margin-bottom: 10px;
            }
            .improvements { 
              color: #ea580c; 
              margin-bottom: 10px;
            }
            .suggestion {
              color: #2563eb;
              margin-bottom: 10px;
            }
            .score-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 14px;
            }
            .score-excellent { background-color: #dcfce7; color: #166534; }
            .score-good { background-color: #fef3c7; color: #92400e; }
            .score-needs-improvement { background-color: #fee2e2; color: #991b1b; }
            .summary-section {
              background-color: #f9fafb;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .metric-card {
              text-align: center;
              padding: 15px;
              background-color: white;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #6366f1;
            }
            .metric-label {
              font-size: 14px;
              color: #6b7280;
              margin-top: 5px;
            }
            ul {
              padding-left: 20px;
            }
            li {
              margin-bottom: 5px;
            }
            @media print {
              body { margin: 0; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Interview Performance Report</h1>
            <div class="score">${overallScore}%</div>
            <p>Generated on: ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="summary-section">
            <h2>Performance Summary</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${overallScore}%</div>
                <div class="metric-label">Overall Score</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${answers.filter(a => a && a.trim() !== '' && a !== 'No answer provided' && a !== 'Question skipped').length}</div>
                <div class="metric-label">Questions Answered</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${questions.length}</div>
                <div class="metric-label">Total Questions</div>
              </div>
            </div>
            <p><strong>Performance Level:</strong> ${
              overallScore >= 85 ? 'Excellent - You demonstrated strong knowledge and communication skills' :
              overallScore >= 70 ? 'Good - Solid performance with room for improvement' :
              overallScore >= 55 ? 'Average - Consider focusing on specific areas for improvement' :
              'Needs Improvement - Additional practice recommended'
            }</p>
          </div>
          
          <h2>Detailed Question Analysis</h2>
          ${questions.map((question, index) => {
            const answer = answers[index] || 'No answer provided';
            const questionFeedback = feedback[index];
            const scoreClass = questionFeedback?.score >= 80 ? 'score-excellent' : 
                             questionFeedback?.score >= 60 ? 'score-good' : 'score-needs-improvement';
            
            return `
              <div class="section">
                <div class="question">Question ${index + 1}: ${question}</div>
                <div class="answer">
                  <strong>Your Answer:</strong><br>
                  ${answer === 'Question skipped' ? '<em>Question was skipped</em>' : answer}
                </div>
                ${questionFeedback ? `
                  <div class="feedback">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                      <strong>AI Feedback</strong>
                      <span class="score-badge ${scoreClass}">${questionFeedback.score}/100</span>
                    </div>
                    ${questionFeedback.strengths && questionFeedback.strengths.length > 0 ? `
                      <div class="strengths">
                        <strong>✓ Strengths:</strong>
                        <ul>
                          ${questionFeedback.strengths.map((s: string) => `<li>${s}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                    ${questionFeedback.areas_to_improve && questionFeedback.areas_to_improve.length > 0 ? `
                      <div class="improvements">
                        <strong>⚠ Areas to Improve:</strong>
                        <ul>
                          ${questionFeedback.areas_to_improve.map((s: string) => `<li>${s}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                    ${questionFeedback.suggestion ? `
                      <div class="suggestion">
                        <strong>💡 Suggestion:</strong> ${questionFeedback.suggestion}
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
          
          ${facialAnalysis && facialAnalysis.length > 0 ? `
            <div class="summary-section">
              <h2>Non-Verbal Communication Analysis</h2>
              <p>Based on facial expression analysis during your interview:</p>
              <ul>
                <li><strong>Primary Emotion:</strong> ${calculateEmotionData().primaryEmotion}</li>
                <li><strong>Average Confidence:</strong> ${calculateEmotionData().confidenceAvg}%</li>
                <li><strong>Average Engagement:</strong> ${calculateEmotionData().engagementAvg}%</li>
              </ul>
              <p><em>Tip: Maintain eye contact and show enthusiasm to improve your non-verbal communication scores.</em></p>
            </div>
          ` : ''}
          
          <div class="summary-section">
            <h2>Next Steps & Recommendations</h2>
            <ul>
              <li>Review the areas marked for improvement in each question</li>
              <li>Practice answering similar questions using the STAR method (Situation, Task, Action, Result)</li>
              <li>Work on providing more specific examples from your experience</li>
              <li>Consider taking another practice interview to track your progress</li>
            </ul>
          </div>
          
          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p>This report was generated by AI Interview Coach. Use this feedback to improve your interview performance.</p>
          </footer>
        </body>
        </html>
      `;
      
      // Create blob and trigger download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Your interview report has been downloaded as HTML. You can print it as PDF from your browser (Ctrl+P).",
      });
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const calculateEmotionData = () => {
    if (!facialAnalysis || facialAnalysis.length === 0) {
      return { 
        primaryEmotion: 'neutral',
        confidenceAvg: 0,
        engagementAvg: 0 
      };
    }

    // Count emotions
    const emotionCounts: {[key: string]: number} = {};
    let totalConfidence = 0;
    let totalEngagement = 0;
    
    facialAnalysis.forEach(analysis => {
      if (!analysis) return;
      
      const emotion = analysis.primary_emotion || 'neutral';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      
      totalConfidence += analysis.confidence_score || 0;
      totalEngagement += analysis.engagement_level || 0;
    });
    
    // Find the most common emotion
    let primaryEmotion = 'neutral';
    let maxCount = 0;
    
    Object.keys(emotionCounts).forEach(emotion => {
      if (emotionCounts[emotion] > maxCount) {
        maxCount = emotionCounts[emotion];
        primaryEmotion = emotion;
      }
    });
    
    // Calculate averages
    const confidenceAvg = Math.round(totalConfidence / facialAnalysis.length);
    const engagementAvg = Math.round(totalEngagement / facialAnalysis.length);
    
    return { primaryEmotion, confidenceAvg, engagementAvg };
  };
  
  const { primaryEmotion, confidenceAvg, engagementAvg } = calculateEmotionData();

  const getEmotionColor = (emotion: string) => {
    const emotionColors: {[key: string]: string} = {
      happy: 'text-green-500',
      confident: 'text-blue-500',
      neutral: 'text-gray-500',
      anxious: 'text-yellow-500',
      nervous: 'text-amber-500',
      confused: 'text-purple-500',
      sad: 'text-blue-400',
      surprised: 'text-pink-500',
      angry: 'text-red-500',
    };
    
    return emotionColors[emotion.toLowerCase()] || 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Report</h1>
          <p className="mt-2 text-gray-600">
            Review your performance and feedback
            {reportSaved && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Saved to Reports
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onDone}>
            <RefreshCw className="mr-2 h-4 w-4" />
            New Interview
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    className="text-gray-200" 
                    strokeWidth="10" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="40" 
                    cx="50" 
                    cy="50" 
                  />
                  <circle 
                    className={`${
                      overallScore >= 80 ? 'text-green-500' : 
                      overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'
                    }`}
                    strokeWidth="10" 
                    strokeDasharray={`${overallScore * 2.51} 251`} 
                    strokeLinecap="round" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="40" 
                    cx="50" 
                    cy="50" 
                  />
                </svg>
                <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{overallScore}</span>
                  <span className="text-sm text-gray-500">Score</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="font-medium">
                  {overallScore >= 80 ? 'Excellent' : 
                   overallScore >= 60 ? 'Good' : 
                   overallScore >= 40 ? 'Average' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Questions Answered</span>
                  <span className="text-sm font-medium">{answers.filter(a => a && a.trim() !== '' && a !== 'No answer provided' && a !== 'Question skipped').length}/{questions.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-purple h-2 rounded-full" 
                    style={{width: `${(answers.filter(a => a && a.trim() !== '' && a !== 'No answer provided' && a !== 'Question skipped').length / questions.length) * 100}%`}}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Answer Clarity</span>
                  <span className="text-sm font-medium">{Math.min(Math.round((overallScore + 10) * 0.9), 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-purple h-2 rounded-full" 
                    style={{width: `${Math.min(Math.round((overallScore + 10) * 0.9), 100)}%`}}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Engagement Level</span>
                  <span className="text-sm font-medium">{engagementAvg}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-brand-purple h-2 rounded-full" 
                    style={{width: `${engagementAvg}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Facial Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold mb-2 capitalize">
                  <span className={getEmotionColor(primaryEmotion)}>
                    {primaryEmotion}
                  </span>
                </div>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Primary emotion detected during your interview
                </p>
                
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Confidence</span>
                    <span className="text-sm font-medium">{confidenceAvg}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{width: `${confidenceAvg}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="questions">Questions & Answers</TabsTrigger>
          <TabsTrigger value="facial">Facial Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-3">Strengths</h3>
                  <ul className="space-y-2">
                    {feedback.length > 0 ? (
                      feedback.slice(0, 3).flatMap(f => 
                        f.strengths?.slice(0, 2).map((s: string, i: number) => (
                          <li key={`strength-${i}`} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>{s}</span>
                          </li>
                        )) || []
                      )
                    ) : (
                      <li className="text-gray-500">Loading feedback...</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-3">Areas to Improve</h3>
                  <ul className="space-y-2">
                    {feedback.length > 0 ? (
                      feedback.slice(0, 3).flatMap(f => 
                        f.areas_to_improve?.slice(0, 2).map((s: string, i: number) => (
                          <li key={`improve-${i}`} className="flex items-start">
                            <div className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 bg-amber-500 rounded-full"></div>
                            </div>
                            <span>{s}</span>
                          </li>
                        )) || []
                      )
                    ) : (
                      <li className="text-gray-500">Loading feedback...</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-3">Next Steps</h3>
                  <p className="text-gray-600">
                    Focus on improving your clarity and providing specific examples when answering technical questions.
                    Consider practicing with more domain-specific questions in areas where you felt less confident.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questions">
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Question {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium">{question}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Your Answer:</p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {answers[index] || "No answer provided"}
                      </p>
                    </div>
                    
                    {feedback[index] && (
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Feedback</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            feedback[index].score >= 80 ? 'bg-green-100 text-green-800' : 
                            feedback[index].score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {feedback[index].score}/100
                          </span>
                        </div>
                        
                        <div className="space-y-3 text-sm">
                          {feedback[index].strengths && feedback[index].strengths.length > 0 && (
                            <div>
                              <p className="font-medium text-green-600">Strengths:</p>
                              <ul className="list-disc pl-5 space-y-1 mt-1">
                                {feedback[index].strengths.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {feedback[index].areas_to_improve && feedback[index].areas_to_improve.length > 0 && (
                            <div>
                              <p className="font-medium text-amber-600">Areas to Improve:</p>
                              <ul className="list-disc pl-5 space-y-1 mt-1">
                                {feedback[index].areas_to_improve.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {feedback[index].suggestion && (
                            <div>
                              <p className="font-medium text-blue-600">Suggestion:</p>
                              <p className="mt-1">{feedback[index].suggestion}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="facial">
          <Card>
            <CardHeader>
              <CardTitle>Facial Expression Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-3">
                    Expression Summary
                  </h3>
                  <p className="text-gray-600">
                    During your interview, you primarily displayed a <span className={`font-medium ${getEmotionColor(primaryEmotion)}`}>{primaryEmotion}</span> expression.
                    Your confidence level was measured at <span className="font-medium">{confidenceAvg}%</span>, and your engagement level at <span className="font-medium">{engagementAvg}%</span>.
                  </p>
                </div>
                
                {facialAnalysis && facialAnalysis.length > 0 && (
                  <div>
                    <h3 className="font-medium text-lg mb-3">Detailed Observations</h3>
                    <div className="space-y-3">
                      {facialAnalysis.slice(0, 5).map((analysis, index) => (
                        analysis && analysis.observations ? (
                          <div key={index} className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm font-medium mb-2">During Question {index + 1}:</p>
                            <ul className="text-sm space-y-1 list-disc pl-5">
                              {analysis.observations.slice(0, 2).map((obs: string, i: number) => (
                                <li key={i}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-lg mb-3">Non-verbal Communication Tips</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                      <span>Maintain eye contact to demonstrate confidence and engagement</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                      <span>Use subtle hand gestures to emphasize key points</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                      <span>Practice a natural smile to create rapport with interviewers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleSaveReport}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save JSON
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default InterviewReport;
