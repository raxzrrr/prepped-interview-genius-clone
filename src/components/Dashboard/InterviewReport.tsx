
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Save, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';
import { useAuth } from '@/contexts/ClerkAuthContext';
import jsPDF from 'jspdf';

interface InterviewReportProps {
  questions: string[];
  answers: string[];
  facialAnalysis: any[];
  interviewId?: string;
  onDone: () => void;
}

const InterviewReport: React.FC<InterviewReportProps> = ({
  questions,
  answers,
  facialAnalysis,
  interviewId,
  onDone
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const { updateInterview } = useInterviewApi();
  const { user } = useAuth();

  // Calculate overall score based on answers quality
  const calculateScore = () => {
    const validAnswers = answers.filter(answer => 
      answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped'
    );
    const answerRatio = validAnswers.length / questions.length;
    const avgLength = validAnswers.reduce((sum, answer) => sum + answer.length, 0) / validAnswers.length || 0;
    
    // Score based on completion and answer quality
    let score = answerRatio * 60; // 60% for completion
    score += Math.min(avgLength / 200 * 40, 40); // 40% for answer quality/length
    
    return Math.round(Math.min(score, 100));
  };

  const overallScore = calculateScore();

  const generatePDF = () => {
    setIsDownloading(true);
    
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;
      
      // Title
      doc.setFontSize(20);
      doc.text('Interview Report', 20, yPosition);
      yPosition += 15;
      
      // Date and Score
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Overall Score: ${overallScore}%`, 20, yPosition);
      yPosition += 15;
      
      // Questions and Answers
      doc.setFontSize(14);
      doc.text('Interview Questions & Answers', 20, yPosition);
      yPosition += 10;
      
      questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        
        // Question
        const questionLines = doc.splitTextToSize(`Q${index + 1}: ${question}`, 170);
        doc.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 5 + 3;
        
        // Answer
        doc.setFont(undefined, 'normal');
        const answer = answers[index] || 'No answer provided';
        const answerLines = doc.splitTextToSize(`A: ${answer}`, 170);
        doc.text(answerLines, 20, yPosition);
        yPosition += answerLines.length * 5 + 8;
      });
      
      // Save the PDF
      doc.save(`interview-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: "Your interview report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const saveReport = async () => {
    if (!interviewId) {
      toast({
        title: "Save Failed",
        description: "No interview ID found. Cannot save report.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      await updateInterview(interviewId, {
        status: 'completed',
        answers: answers,
        score: overallScore,
        facial_analysis: facialAnalysis,
        completed_at: new Date().toISOString()
      });
      
      toast({
        title: "Report Saved",
        description: "Your interview report has been saved successfully.",
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

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interview Report</h1>
          <p className="mt-2 text-gray-600">
            Review your performance and download your report
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={saveReport}
            disabled={isSaving}
            className="flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Report
              </>
            )}
          </Button>
          <Button
            onClick={generatePDF}
            disabled={isDownloading}
            className="flex items-center"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Performance</span>
            <Badge variant={getScoreBadgeVariant(overallScore)} className="text-lg px-3 py-1">
              {overallScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Performance Score</span>
                <span className={getScoreColor(overallScore)}>{overallScore}%</span>
              </div>
              <Progress value={overallScore} className="h-3" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-purple">
                  {questions.length}
                </div>
                <div className="text-sm text-gray-500">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {answers.filter(a => a && a.trim() !== '' && a !== 'No answer provided' && a !== 'Question skipped').length}
                </div>
                <div className="text-sm text-gray-500">Answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {answers.filter(a => !a || a.trim() === '' || a === 'No answer provided' || a === 'Question skipped').length}
                </div>
                <div className="text-sm text-gray-500">Skipped</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Questions & Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const answer = answers[index];
              const isAnswered = answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped';
              
              return (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {isAnswered ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-1" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="mb-2">
                        <span className="font-medium text-gray-900">
                          Question {index + 1}:
                        </span>
                        <p className="mt-1 text-gray-700">{question}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">Answer:</span>
                        <p className={`mt-1 ${isAnswered ? 'text-gray-700' : 'text-gray-500 italic'}`}>
                          {answer || 'No answer provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onDone}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Start New Interview
        </Button>
      </div>
    </div>
  );
};

export default InterviewReport;
