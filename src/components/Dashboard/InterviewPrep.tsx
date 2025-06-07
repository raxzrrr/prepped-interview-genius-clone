import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import { Mic, MicOff, Play, Pause, SkipForward, CheckCircle, Loader2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
}

const InterviewPrep: React.FC<InterviewPrepProps> = ({ 
  questions, 
  onComplete, 
  resumeAnalysis 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { evaluateAnswer } = useInterviewApi();
  const { toast } = useToast();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [finalAnswers, setFinalAnswers] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [facialAnalysis, setFacialAnalysis] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Calculate preliminary score (before evaluations)
  const calculateScore = (evaluationsList: any[], answersList: string[]) => {
    let totalScore = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const evaluation = evaluationsList[i];
      const answer = answersList[i];
      
      if (evaluation && evaluation.score_breakdown && evaluation.score_breakdown.overall) {
        // Use AI evaluation score
        totalScore += evaluation.score_breakdown.overall;
      } else if (answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped') {
        // If no evaluation but has answer, give a lower moderate score (tougher)
        totalScore += 40; // Reduced from 60 to 40
      }
      // If no answer, contribute 0 to the score
    }
    
    return Math.round(totalScore / questions.length); // Average across all questions
  };

  // Calculate final score only when evaluations are complete
  const calculateFinalScore = (evaluationsList: any[], answersList: string[]) => {
    // Only calculate if we have all evaluations or evaluation is complete
    if (isEvaluating) return null;
    
    let totalScore = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const evaluation = evaluationsList[i];
      const answer = answersList[i];
      
      if (evaluation && evaluation.score_breakdown && evaluation.score_breakdown.overall) {
        // Use AI evaluation score
        totalScore += evaluation.score_breakdown.overall;
      } else if (answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped') {
        // If no evaluation but has answer, give a lower moderate score (tougher)
        totalScore += 40; // Reduced from 60 to 40
      }
      // If no answer, contribute 0 to the score
    }
    
    return Math.round(totalScore / questions.length); // Average across all questions
  };

  useEffect(() => {
    let stream: MediaStream | null = null;

    const getMicrophone = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);

        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        recorder.ondataavailable = (event) => {
          // Handle the recorded data (e.g., upload to server, play locally)
          console.log('Recorded data:', event.data);
        };

        recorder.onstop = () => {
          // Handle the end of recording
          console.log('Recording stopped');
        };
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to use the recording feature.",
          variant: "destructive",
        });
      }
    };

    getMicrophone();

    return () => {
      // Clean up the stream when the component unmounts
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const handleStartRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive' && audioStream) {
      try {
        mediaRecorder.start();
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "Your answer is now being recorded.",
        });
      } catch (error) {
        console.error('Error starting recording:', error);
        toast({
          title: "Recording Error",
          description: "Failed to start recording. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Recording Error",
        description: "Please allow microphone access to use the recording feature.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      try {
        mediaRecorder.stop();
        setIsRecording(false);
        toast({
          title: "Recording Stopped",
          description: "Your recording has been saved.",
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
        toast({
          title: "Recording Error",
          description: "Failed to stop recording. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNextQuestion = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = currentAnswer;
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCompleteInterview(updatedAnswers);
    }
  };

  const handleSkipQuestion = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestionIndex] = 'Question skipped';
    setAnswers(updatedAnswers);
    setCurrentAnswer('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleCompleteInterview(updatedAnswers);
    }
  };

  const handleCompleteInterview = async (finalAnswersList: string[]) => {
    console.log('Interview completed with answers:', finalAnswersList);
    setFinalAnswers(finalAnswersList);
    setIsComplete(true);
    setIsEvaluating(true);

    // Generate evaluations for all questions
    const evaluationPromises = questions.map(async (question, index) => {
      const answer = finalAnswersList[index];
      try {
        console.log(`Getting evaluation for question ${index + 1}:`, question);
        const evaluation = await evaluateAnswer(question, answer);
        console.log(`Received evaluation for question ${index + 1}:`, evaluation);
        return evaluation;
      } catch (error) {
        console.error(`Error evaluating question ${index + 1}:`, error);
        return null;
      }
    });

    try {
      const allEvaluations = await Promise.all(evaluationPromises);
      console.log('All evaluations completed:', allEvaluations);
      setEvaluations(allEvaluations);
      setIsEvaluating(false);

      // Call onComplete with the final data
      onComplete({
        questions,
        answers: finalAnswersList,
        evaluations: allEvaluations,
        facialAnalysis,
      });
    } catch (error) {
      console.error('Error during evaluation:', error);
      setIsEvaluating(false);
      toast({
        title: "Evaluation Error",
        description: "Some evaluations could not be completed, but your interview has been saved.",
        variant: "destructive",
      });

      // Still call onComplete even if evaluations failed
      onComplete({
        questions,
        answers: finalAnswersList,
        evaluations: [],
        facialAnalysis,
      });
    }
  };

  const generatePDF = () => {
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
      
      const score = calculateFinalScore(evaluations, finalAnswers) || 0;
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
        
        if (resumeAnalysis.skills && resumeAnalysis.skills.length > 0) {
          const skillsText = `Skills: ${resumeAnalysis.skills.join(', ')}`;
          const skillsLines = doc.splitTextToSize(skillsText, 170);
          doc.text(skillsLines, 20, yPosition);
          yPosition += skillsLines.length * 5 + 5;
        }
        
        yPosition += 5;
      }
      
      // Questions and Answers
      doc.setFontSize(14);
      doc.text('Interview Questions and Answers', 20, yPosition);
      yPosition += 10;
      
      questions.forEach((question, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 60) {
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
        const answerLines = doc.splitTextToSize(`Answer: ${answer}`, 170);
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to continue with the interview.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (isComplete || isEvaluating) {
    // Calculate score using final calculation method
    const score = calculateFinalScore(evaluations, finalAnswers);
    const validAnswers = finalAnswers.filter(answer => 
      answer && answer.trim() !== '' && answer !== 'No answer provided' && answer !== 'Question skipped'
    );

    return (
      <div className="space-y-6">
        {isEvaluating ? (
          <Card>
            <CardHeader>
              <CardTitle>Evaluating Your Performance...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
                <p className="text-gray-600">Generating AI evaluations for your answers...</p>
                <p className="text-sm text-gray-500 mt-2">Score will be calculated after evaluation completes</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Interview Completed!</span>
                {isEvaluating ? (
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    Evaluating...
                  </Badge>
                ) : (
                  <Badge variant={score && getScoreBadgeVariant(score)} className="text-lg px-3 py-1">
                    {score || 0}%
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{isEvaluating ? 'Evaluating Performance...' : 'Performance Score (Based on AI Evaluation)'}</span>
                    {isEvaluating ? (
                      <span className="text-gray-500">Calculating...</span>
                    ) : (
                      <span className={score && getScoreColor(score)}>{score || 0}%</span>
                    )}
                  </div>
                  <Progress value={isEvaluating ? 0 : (score || 0)} className="h-3" />
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
                
                <div className="flex justify-center space-x-4 pt-4">
                  <Button
                    onClick={generatePDF}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Interview</h1>
          <p className="mt-2 text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {Math.round(((currentQuestionIndex) / questions.length) * 100)}% Complete
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="mr-3 text-brand-purple">Q{currentQuestionIndex + 1}:</span>
            {questions[currentQuestionIndex]}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Your Answer:</label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here or use the microphone to record..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-purple focus:border-transparent resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
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
                    Start Recording
                  </>
                )}
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleSkipQuestion}
                className="flex items-center"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Skip Question
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={!currentAnswer.trim()}
                className="flex items-center"
              >
                {currentQuestionIndex === questions.length - 1 ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Interview
                  </>
                ) : (
                  <>
                    <SkipForward className="mr-2 h-4 w-4" />
                    Next Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interview Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Questions Completed</span>
              <span>{currentQuestionIndex} of {questions.length}</span>
            </div>
            <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewPrep;
