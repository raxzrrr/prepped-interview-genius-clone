
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ResumeAnalysisResults from './ResumeAnalysisResults';
import jsPDF from 'jspdf';

interface InterviewReportProps {
  questions: string[];
  answers: string[];
  evaluations?: any[];
  facialAnalysis: any[];
  resumeAnalysis?: any;
  interviewId?: string;
  score?: number;
  onDone: () => void;
}

const InterviewReport: React.FC<InterviewReportProps> = ({
  questions,
  answers,
  evaluations = [],
  facialAnalysis,
  resumeAnalysis,
  interviewId,
  score,
  onDone
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  // Calculate overall score if not provided
  const calculateScore = () => {
    if (score !== undefined) return score;
    
    const validAnswers = answers.filter(answer => 
      answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped'
    );
    const answerRatio = validAnswers.length / questions.length;
    const avgLength = validAnswers.reduce((sum, answer) => sum + answer.length, 0) / validAnswers.length || 0;
    
    // Score based on completion and answer quality
    let calculatedScore = answerRatio * 60; // 60% for completion
    calculatedScore += Math.min(avgLength / 200 * 40, 40); // 40% for answer quality/length
    
    return Math.round(Math.min(calculatedScore, 100));
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
      
      // Resume Analysis (if available)
      if (resumeAnalysis) {
        doc.setFontSize(14);
        doc.text('Resume Analysis', 20, yPosition);
        yPosition += 10;
        
        if (resumeAnalysis.suggested_role) {
          doc.setFontSize(11);
          doc.text(`Suggested Role: ${resumeAnalysis.suggested_role}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (resumeAnalysis.skills && resumeAnalysis.skills.length > 0) {
          const skillsText = `Skills: ${resumeAnalysis.skills.join(', ')}`;
          const skillsLines = doc.splitTextToSize(skillsText, 170);
          doc.text(skillsLines, 20, yPosition);
          yPosition += skillsLines.length * 5 + 5;
        }
        
        yPosition += 5;
      }
      
      // Questions, Answers, and Evaluations
      doc.setFontSize(14);
      doc.text('Interview Questions, Answers & Evaluations', 20, yPosition);
      yPosition += 10;
      
      questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
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
        const answerLines = doc.splitTextToSize(`Your Answer: ${answer}`, 170);
        doc.text(answerLines, 20, yPosition);
        yPosition += answerLines.length * 5 + 5;
        
        // Evaluation (if available)
        const evaluation = evaluations[index];
        if (evaluation) {
          doc.setFont(undefined, 'bold');
          doc.text('Ideal Answer:', 20, yPosition);
          yPosition += 5;
          
          doc.setFont(undefined, 'normal');
          const idealLines = doc.splitTextToSize(evaluation.ideal_answer, 170);
          doc.text(idealLines, 20, yPosition);
          yPosition += idealLines.length * 5 + 5;
          
          if (evaluation.score_breakdown) {
            doc.setFont(undefined, 'bold');
            doc.text('Score Breakdown:', 20, yPosition);
            yPosition += 5;
            
            doc.setFont(undefined, 'normal');
            const breakdown = evaluation.score_breakdown;
            doc.text(`Clarity: ${breakdown.clarity}/100, Relevance: ${breakdown.relevance}/100`, 20, yPosition);
            yPosition += 5;
            doc.text(`Depth: ${breakdown.depth}/100, Examples: ${breakdown.examples}/100`, 20, yPosition);
            yPosition += 5;
            doc.text(`Overall: ${breakdown.overall}/100`, 20, yPosition);
            yPosition += 5;
          }
          
          if (evaluation.feedback) {
            doc.setFont(undefined, 'bold');
            doc.text('Feedback:', 20, yPosition);
            yPosition += 5;
            
            doc.setFont(undefined, 'normal');
            const feedbackLines = doc.splitTextToSize(evaluation.feedback, 170);
            doc.text(feedbackLines, 20, yPosition);
            yPosition += feedbackLines.length * 5;
          }
        }
        
        yPosition += 8;
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
          <h1 className="text-3xl font-bold tracking-tight">Interview Completed!</h1>
          <p className="mt-2 text-gray-600">
            Review your performance and download your report
          </p>
        </div>
        <div className="flex space-x-3">
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
                Download PDF Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resume Analysis Results (if available) */}
      {resumeAnalysis && (
        <ResumeAnalysisResults analysis={resumeAnalysis} />
      )}

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

      {/* Questions, Answers, and Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Questions, Answers & Evaluations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {questions.map((question, index) => {
              const answer = answers[index];
              const evaluation = evaluations[index];
              const isAnswered = answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped';
              
              return (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="flex-shrink-0">
                      {isAnswered ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mt-1" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="mb-3">
                        <span className="font-medium text-gray-900">
                          Question {index + 1}:
                        </span>
                        <p className="mt-1 text-gray-700">{question}</p>
                      </div>
                      <div className="mb-3">
                        <span className="font-medium text-gray-900">Your Answer:</span>
                        <p className={`mt-1 p-3 rounded-md ${isAnswered ? 'text-gray-700 bg-blue-50' : 'text-gray-500 italic bg-gray-50'}`}>
                          {answer || 'No answer provided'}
                        </p>
                      </div>
                      
                      {evaluation && (
                        <div className="space-y-4">
                          <div>
                            <span className="font-medium text-gray-900">Ideal Answer:</span>
                            <p className="mt-1 p-3 rounded-md text-gray-700 bg-green-50">
                              {evaluation.ideal_answer}
                            </p>
                          </div>
                          
                          {evaluation.evaluation_criteria && (
                            <div>
                              <span className="font-medium text-gray-900">Evaluation Criteria:</span>
                              <ul className="mt-1 list-disc list-inside text-gray-700">
                                {evaluation.evaluation_criteria.map((criteria: string, idx: number) => (
                                  <li key={idx}>{criteria}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {evaluation.score_breakdown && (
                            <div>
                              <span className="font-medium text-gray-900">Score Breakdown:</span>
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">{evaluation.score_breakdown.clarity}</div>
                                  <div className="text-xs text-gray-500">Clarity</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">{evaluation.score_breakdown.relevance}</div>
                                  <div className="text-xs text-gray-500">Relevance</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">{evaluation.score_breakdown.depth}</div>
                                  <div className="text-xs text-gray-500">Depth</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">{evaluation.score_breakdown.examples}</div>
                                  <div className="text-xs text-gray-500">Examples</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-600">{evaluation.score_breakdown.overall}</div>
                                  <div className="text-xs text-gray-500">Overall</div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {evaluation.feedback && (
                            <div>
                              <span className="font-medium text-gray-900">Detailed Feedback:</span>
                              <p className="mt-1 p-3 rounded-md text-gray-700 bg-yellow-50">
                                {evaluation.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
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
