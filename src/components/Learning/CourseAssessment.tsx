import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Award, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { assessmentService, AssessmentQuestion, AssessmentAnswer, AssessmentResult } from '@/services/assessmentService';

interface CourseAssessmentProps {
  courseId: string;
  courseName: string;
  isUnlocked: boolean;
  onComplete: (passed: boolean, score: number) => void;
  onClose: () => void;
}

const CourseAssessment: React.FC<CourseAssessmentProps> = ({
  courseId,
  courseName,
  isUnlocked,
  onComplete,
  onClose
}) => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  const { toast } = useToast();
  const { user, getSupabaseUserId } = useAuth();

  // Load questions when component mounts
  useEffect(() => {
    if (isUnlocked) {
      loadQuestions();
    } else {
      setLoadingQuestions(false);
    }
  }, [isUnlocked, courseId]);

  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const fetchedQuestions = await assessmentService.getAssessmentQuestions(courseId);
      
      if (fetchedQuestions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "This course doesn't have any assessment questions yet.",
          variant: "destructive"
        });
        return;
      }

      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Error Loading Questions",
        description: "Failed to load assessment questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswerSelect = (answerValue: string) => {
    setSelectedAnswer(parseInt(answerValue));
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    // Save the answer
    const newAnswer: AssessmentAnswer = {
      questionId: questions[currentQuestionIndex].id,
      selectedAnswer: selectedAnswer
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    // Move to next question or finish assessment
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      finishAssessment(updatedAnswers);
    }
  };

  const finishAssessment = async (finalAnswers: AssessmentAnswer[]) => {
    setLoading(true);
    
    try {
      // Get raw Clerk user ID (not the converted UUID)
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('Starting assessment evaluation for user:', user.id);

      // Pass raw Clerk user ID to the service, not the converted UUID
      const result = await assessmentService.evaluateAndSaveAssessment(
        user.id, 
        courseId, 
        courseName, 
        finalAnswers
      );
      
      setAssessmentResult(result);

      // Show appropriate toast message
      if (result.passed) {
        toast({
          title: "Congratulations!",
          description: `You passed with ${result.score}%! Results saved successfully.`,
        });
      } else {
        toast({
          title: "Assessment Complete",
          description: `You scored ${result.score}%. You need 70% or higher to pass. Results saved.`,
        });
      }

      setShowResults(true);
      onComplete(result.passed, result.score);

    } catch (error) {
      console.error('Error finishing assessment:', error);
      
      // Try fallback evaluation before showing error
      if (finalAnswers.length > 0) {
        try {
          console.log('Attempting fallback evaluation...');
          const fallbackResult = await assessmentService.calculateResults(courseId, finalAnswers);
          setAssessmentResult(fallbackResult);
          setShowResults(true);
          onComplete(fallbackResult.passed, fallbackResult.score);
          
          toast({
            title: "Assessment Complete",
            description: "Results calculated but may not be saved permanently. Please try again if this persists.",
            variant: "default"
          });
          return;
        } catch (fallbackError) {
          console.error('Fallback calculation also failed:', fallbackError);
        }
      }
      
      toast({
        title: "Unable to evaluate your assessment, please try again.",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show locked state
  if (!isUnlocked) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Lock className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Assessment Locked</h3>
          <p className="text-gray-600 mb-4">
            Complete all course videos to unlock the assessment
          </p>
          <Button onClick={onClose} variant="outline">
            Back to Course
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loadingQuestions || loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg font-medium">
            {loadingQuestions ? 'Loading assessment questions...' : 'Processing your results...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">This will just take a moment</p>
        </CardContent>
      </Card>
    );
  }

  // Show no questions state
  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Questions Available</h3>
          <p className="text-gray-600 mb-4">
            This course doesn't have any assessment questions yet.
          </p>
          <Button onClick={onClose} variant="outline">
            Back to Course
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show results
  if (showResults && assessmentResult) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {assessmentResult.passed ? (
              <Award className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {assessmentResult.passed ? 'Congratulations!' : 'Assessment Not Passed'}
          </CardTitle>
          <CardDescription>
            {assessmentResult.passed 
              ? 'You have successfully passed the course assessment!' 
              : 'You need 80% or higher to pass. Please review and try again.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${assessmentResult.passed ? 'text-green-600' : 'text-red-600'}`}>
              {assessmentResult.score}%
            </div>
            <p className="text-gray-600">
              {assessmentResult.correctAnswers} out of {assessmentResult.totalQuestions} questions correct
            </p>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {questions.map((question, index) => {
              const userAnswer = assessmentResult.answers.find(a => a.questionId === question.id);
              const isCorrect = userAnswer?.selectedAnswer === question.correct_answer;
              
              return (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Q{index + 1}: {question.question_text}</p>
                        <Badge variant={question.difficulty_level === 'easy' ? 'secondary' : 'destructive'}>
                          {question.difficulty_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your answer: {userAnswer ? question[`option_${userAnswer.selectedAnswer}` as keyof AssessmentQuestion] as string : 'Not answered'}
                      </p>
                      {!isCorrect && (
                         <p className="text-sm text-green-600">
                           Correct answer: {question[`option_${question.correct_answer}` as keyof AssessmentQuestion] as string}
                         </p>
                       )}
                       {question.explanation && (
                         <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                           <strong>Explanation:</strong> {question.explanation}
                         </p>
                       )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Results Saved Successfully</span>
            </div>
            <p className="text-sm text-green-700">
              Your assessment results have been saved to your profile.
              {assessmentResult.passed && " Your certificate has been generated and is available in your certificates section."}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            {assessmentResult.passed && (
              <Button onClick={() => window.location.href = '/student/certificates'}>
                View Certificates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show current question
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{courseName} Assessment</CardTitle>
          <Badge variant={currentQuestion.difficulty_level === 'easy' ? 'secondary' : 'destructive'}>
            {currentQuestion.difficulty_level}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question_text}</h3>
          
          <RadioGroup value={selectedAnswer?.toString() || ''} onValueChange={handleAnswerSelect}>
            {[1, 2, 3, 4].map((optionNumber) => (
              <div key={optionNumber} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={optionNumber.toString()} id={`option-${optionNumber}`} />
                <Label htmlFor={`option-${optionNumber}`} className="flex-1 cursor-pointer">
                  {currentQuestion[`option_${optionNumber}` as keyof AssessmentQuestion] as string}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex justify-between">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseAssessment;