import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedAnswers, setExpandedAnswers] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  // Helper function to truncate text
  const truncateText = (text: string, maxLines: number = 3) => {
    if (!text) return text;
    
    const words = text.split(' ');
    const wordsPerLine = 15; // Approximate words per line
    const maxWords = maxLines * wordsPerLine;
    
    if (words.length <= maxWords) {
      return text;
    }
    
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Toggle answer expansion
  const toggleAnswerExpansion = (index: number) => {
    setExpandedAnswers(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Helper function to render formatted text
  const renderFormattedText = (text: string) => {
    if (!text) return text;
    
    // Convert markdown-style formatting to JSX
    return text
      .split('\n')
      .map((line, index) => {
        // Handle bullet points
        if (line.trim().startsWith('*')) {
          const content = line.replace(/^\s*\*\s*/, '');
          // Handle bold text within bullet points
          const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <div key={index} className="ml-4 mb-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 mt-2"></span>
              <span dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>
          );
        }
        // Handle bold text in regular lines
        const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return formattedLine ? (
          <div key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedLine }} />
        ) : (
          <br key={index} />
        );
      });
  };

  // Calculate overall score based on AI evaluations with tougher metrics
  const calculateScore = () => {
    if (score !== undefined) return score;
    
    let totalScore = 0;
    let validEvaluations = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const evaluation = evaluations[i];
      const answer = answers[i];
      
      if (evaluation && evaluation.score_breakdown && evaluation.score_breakdown.overall) {
        // Use AI evaluation score
        totalScore += evaluation.score_breakdown.overall;
        validEvaluations++;
      } else if (answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped') {
        // If no evaluation but has answer, give a lower moderate score (tougher)
        totalScore += 40; // Reduced from 60 to 40
        validEvaluations++;
      }
      // If no answer and no evaluation, contribute 0 to the score
    }
    
    if (validEvaluations === 0) return 0;
    return Math.round(totalScore / questions.length); // Average across all questions
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

  // Tougher score color thresholds
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'; // Raised from 85 to 90
    if (score >= 75) return 'text-yellow-600'; // Raised from 70 to 75
    return 'text-red-600';
  };

  // Tougher badge variant thresholds
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'; // Raised from 85 to 90
    if (score >= 75) return 'secondary'; // Raised from 70 to 75
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
                <span>Performance Score (Based on AI Evaluation)</span>
                <span className={getScoreColor(overallScore)}>{overallScore}%</span>
              </div>
              <Progress value={overallScore} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor (0-74%)</span>
                <span>Good (75-89%)</span>
                <span>Excellent (90%+)</span>
              </div>
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
              const isExpanded = expandedAnswers[index];
              const shouldTruncate = answer && answer.length > 200; // Truncate if longer than 200 characters
              
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
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">Your Answer:</span>
                          {shouldTruncate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleAnswerExpansion(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-1" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Show more
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <div className={`mt-1 p-3 rounded-md ${isAnswered ? 'text-gray-700 bg-blue-50' : 'text-gray-500 italic bg-gray-50'}`}>
                          {isAnswered ? (
                            renderFormattedText(
                              shouldTruncate && !isExpanded 
                                ? truncateText(answer) 
                                : answer
                            )
                          ) : (
                            'No answer provided'
                          )}
                        </div>
                      </div>
                      
                      {evaluation && isAnswered && (
                        <div className="space-y-4">
                          <div>
                            <span className="font-medium text-gray-900">Ideal Answer:</span>
                            <div className="mt-1 p-3 rounded-md text-gray-700 bg-green-50">
                              {renderFormattedText(evaluation.ideal_answer)}
                            </div>
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
                              <div className="mt-1 p-3 rounded-md text-gray-700 bg-yellow-50">
                                {renderFormattedText(evaluation.feedback)}
                              </div>
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
