import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Volume2, VolumeX, Play, SkipForward, CheckCircle, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';
import { useAuth } from '@/contexts/ClerkAuthContext';
import voiceToTextService from '@/services/voiceToTextService';
import ttsService from '@/services/ttsService';
import ResumeAnalysisResults from './ResumeAnalysisResults';
import jsPDF from 'jspdf';

interface InterviewPrepProps {
  questions: string[];
  onComplete: (data: { 
    questions: string[], 
    answers: string[], 
    evaluations: any[],
    facialAnalysis: any[], 
    interviewId?: string 
  }) => void;
  resumeAnalysis?: any;
  interviewId?: string;
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ 
  questions, 
  onComplete, 
  resumeAnalysis,
  interviewId 
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { getAnswerFeedback, evaluateAnswer } = useInterviewApi();

  useEffect(() => {
    console.log('InterviewPrep mounted. Auth state:', {
      hasUser: !!user,
      isAuthenticated,
      questionsLength: questions.length
    });

    if (questions.length > 0) {
      // Set initial answer from answers array
      setCurrentAnswer(answers[0] || '');
    }
    return () => cleanup();
  }, [questions]);

  // Real-time answer saving
  useEffect(() => {
    if (currentQuestionIndex < questions.length) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);
      console.log('Real-time answer saved for question', currentQuestionIndex + 1, ':', currentAnswer);
    }
  }, [currentAnswer, currentQuestionIndex]);

  // Load answer when question changes
  useEffect(() => {
    setCurrentAnswer(answers[currentQuestionIndex] || '');
  }, [currentQuestionIndex, answers]);

  const cleanup = () => {
    if (recordingStream) {
      recordingStream.getTracks().forEach(track => track.stop());
    }
    ttsService.stop();
  };

  const speakQuestion = async (question: string) => {
    if (!audioEnabled) return;
    
    try {
      setIsPlaying(true);
      await ttsService.speak(question);
    } catch (error) {
      console.error('TTS Error:', error);
      console.warn('Audio playback failed, continuing without audio');
    } finally {
      setIsPlaying(false);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      
      const stream = await voiceToTextService.startRecording();
      setRecordingStream(stream);
      
      toast({
        title: "Recording Started",
        description: "Speak your answer now...",
      });
    } catch (error) {
      console.error('Recording error:', error);
      setIsRecording(false);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        setRecordingStream(null);
      }
      
      const transcription = await voiceToTextService.stopRecording();
      
      if (transcription && transcription.trim()) {
        const answer = transcription.trim();
        setCurrentAnswer(answer);
        
        toast({
          title: "Answer Recorded",
          description: "Your answer has been saved.",
        });
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast({
        title: "Recording Error", 
        description: "Failed to process recording. Please try typing your answer instead.",
        variant: "destructive",
      });
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const skipQuestion = () => {
    const newAnswers = [...answers];
    if (!newAnswers[currentQuestionIndex] || newAnswers[currentQuestionIndex].trim() === '') {
      newAnswers[currentQuestionIndex] = 'Question skipped';
      setAnswers(newAnswers);
      console.log('Question skipped at index:', currentQuestionIndex);
    }
    nextQuestion();
  };

  const generateEvaluations = async (finalAnswers: string[]) => {
    setIsEvaluating(true);
    const newEvaluations: any[] = [];
    
    try {
      // Generate evaluations for ALL questions, including skipped ones
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const answer = finalAnswers[i] || 'No answer provided';
        
        console.log(`Generating evaluation for question ${i + 1} (Answer: ${answer})`);
        const evaluation = await evaluateAnswer(question, answer);
        newEvaluations[i] = evaluation;
      }
      
      setEvaluations(newEvaluations);
      console.log('All evaluations completed');
    } catch (error) {
      console.error('Error generating evaluations:', error);
      toast({
        title: "Evaluation Error",
        description: "Some evaluations could not be generated, but your interview is still saved.",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
    
    return newEvaluations;
  };

  const generatePDF = () => {
    setIsGeneratingPDF(true);
    
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
      
      const validAnswers = finalAnswers.filter(answer => 
        answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped'
      );
      const score = Math.round((validAnswers.length / questions.length) * 100);
      doc.text(`Overall Score: ${score}%`, 20, yPosition);
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
        
        yPosition += 5;
      }
      
      // Questions, Answers, and Evaluations
      doc.setFontSize(14);
      doc.text('Interview Questions & Answers', 20, yPosition);
      yPosition += 10;
      
      questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 80) {
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
        const answer = finalAnswers[index] || 'No answer provided';
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
      setIsGeneratingPDF(false);
    }
  };

  const finishInterview = async () => {
    try {
      console.log('Finishing interview and generating evaluations...');
      
      // Ensure final answer is saved
      const finalAnswers = [...answers];
      if (currentAnswer.trim()) {
        finalAnswers[currentQuestionIndex] = currentAnswer.trim();
        console.log('Final answer saved:', currentAnswer.trim());
      } else if (!finalAnswers[currentQuestionIndex] || finalAnswers[currentQuestionIndex].trim() === '') {
        finalAnswers[currentQuestionIndex] = 'No answer provided';
      }
      
      setAnswers(finalAnswers);
      console.log('Final answers array:', finalAnswers);
      
      // Generate evaluations for all answers (including skipped ones)
      const newEvaluations = await generateEvaluations(finalAnswers);
      
      cleanup();
      setIsComplete(true);
      
      toast({
        title: "Interview Completed",
        description: "Your interview has been completed and evaluated! You can now download the report.",
      });
      
      // Call onComplete with the final data including evaluations
      onComplete({
        questions,
        answers: finalAnswers,
        evaluations: newEvaluations,
        facialAnalysis: [], // Empty array since we removed facial analysis
        interviewId
      });
      
    } catch (error: any) {
      console.error('Error finishing interview:', error);
      toast({
        title: "Completion Error",
        description: "There was an issue completing the interview, but your answers are preserved.",
        variant: "destructive",
      });
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
    }
  };

  const replayQuestion = () => {
    if (audioEnabled && questions[currentQuestionIndex]) {
      speakQuestion(questions[currentQuestionIndex]);
    }
  };

  // Calculate final answers for the completion view
  const finalAnswers = [...answers];
  if (currentAnswer.trim()) {
    finalAnswers[currentQuestionIndex] = currentAnswer.trim();
  }

  if (isComplete || isEvaluating) {
    // Calculate score
    const validAnswers = finalAnswers.filter(answer => 
      answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped'
    );
    const score = Math.round((validAnswers.length / questions.length) * 100);

    return (
      <div className="space-y-6">
        {resumeAnalysis && (
          <ResumeAnalysisResults analysis={resumeAnalysis} />
        )}
        
        {isEvaluating && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
                <p className="text-gray-600">Generating AI evaluations for your answers...</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Overall Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Interview Completed!</span>
              <Badge variant={score >= 85 ? "default" : score >= 70 ? "secondary" : "destructive"} className="text-lg px-3 py-1">
                {score}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Performance Score</span>
                  <span className={score >= 85 ? 'text-green-600' : score >= 70 ? 'text-yellow-600' : 'text-red-600'}>{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
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
                    {validAnswers.length}
                  </div>
                  <div className="text-sm text-gray-500">Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {questions.length - validAnswers.length}
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
                const answer = finalAnswers[index];
                const evaluation = evaluations[index];
                const isAnswered = answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped';
                
                return (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-3 mb-4">
                      <div className="flex-shrink-0">
                        {isAnswered ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-red-500 mt-1" />
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

        {/* Actions */}
        {!isEvaluating && (
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsComplete(false);
                setCurrentQuestionIndex(0);
                setAnswers(new Array(questions.length).fill(''));
                setCurrentAnswer('');
                setEvaluations([]);
              }}
            >
              Start New Interview
            </Button>
            
            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center"
            >
              {isGeneratingPDF ? (
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
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-500">No questions available</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {resumeAnalysis && (
        <ResumeAnalysisResults analysis={resumeAnalysis} />
      )}
      
      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Interview Progress</CardTitle>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Question</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="flex items-center"
              >
                {audioEnabled ? (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Audio On
                  </>
                ) : (
                  <>
                    <VolumeX className="mr-2 h-4 w-4" />
                    Audio Off
                  </>
                )}
              </Button>
              {audioEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speakQuestion(currentQuestion)}
                  disabled={isPlaying}
                  className="flex items-center"
                >
                  {isPlaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Play Question
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg font-medium">{currentQuestion}</p>
            
            {/* Answer Input Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type your answer:
                </label>
                <Textarea
                  placeholder="Type your answer here..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="text-center text-gray-500">
                — OR —
              </div>
              
              {/* Recording Controls */}
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="flex items-center"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Record Answer
                    </>
                  )}
                </Button>
                
                {isRecording && (
                  <div className="flex items-center text-red-500">
                    <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Recording...
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={skipQuestion}
              className="flex items-center"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip Question
            </Button>
            
            <div className="flex space-x-3">
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={nextQuestion}
                  className="flex items-center"
                >
                  Next Question
                  <SkipForward className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={finishInterview}
                  className="flex items-center bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Finish Interview
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewPrep;
