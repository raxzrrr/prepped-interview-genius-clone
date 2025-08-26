import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, XCircle, Award } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { questionService, CourseQuestion } from '@/services/questionService';
import { assessmentService, AssessmentAnswer } from '@/services/assessmentService';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleAssessmentProps {
  courseId: string;
  courseName: string;
  totalModules: number;
  onComplete: (passed: boolean, score: number) => void;
  onCancel: () => void;
}

const SimpleAssessment: React.FC<SimpleAssessmentProps> = ({
  courseId,
  courseName,
  totalModules,
  onComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const questionsData = await questionService.fetchQuestionsByCourse(courseId);
        
        if (questionsData.length === 0) {
          setError('No questions available for this course');
          return;
        }
        
        setQuestions(questionsData);
      } catch (err: any) {
        console.error('Error loading questions:', err);
        setError('Failed to load assessment questions');
        toast({
          title: 'Error',
          description: 'Failed to load assessment questions',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [courseId, toast]);

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === '') return;

    // Save current answer
    const newAnswers = {
      ...answers,
      [questions[currentQuestion].id]: parseInt(selectedAnswer)
    };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // Move to next question
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      // Submit assessment
      submitAssessment(newAnswers);
    }
  };

  const submitAssessment = async (finalAnswers: Record<string, number>) => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      
      // Convert answers to expected format
      const assessmentAnswers: AssessmentAnswer[] = Object.entries(finalAnswers).map(([questionId, answer]) => ({
        questionId,
        selectedAnswer: answer
      }));

      // Submit to assessment service with totalModules
      const result = await assessmentService.evaluateAndSaveAssessment(
        user.id,
        courseId,
        courseName,
        assessmentAnswers,
        totalModules
      );

      setResults(result);
      setShowResults(true);
      
      toast({
        title: 'Assessment Submitted',
        description: `You scored ${result.score}%! ${result.passed ? 'Congratulations!' : 'Keep practicing!'}`
      });
    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = () => {
    onComplete(results?.passed || false, results?.score || 0);
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading assessment...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={onCancel} variant="outline">
              Back to Course
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (showResults && results) {
    const correctAnswers = Object.entries(answers).filter(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      return question && answer === question.correct_answer;
    }).length;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            {results.passed ? (
              <>
                <Award className="h-6 w-6 text-yellow-500" />
                Assessment Passed!
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-orange-500" />
                Assessment Complete
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${results.passed ? 'text-green-600' : 'text-orange-600'}`}>
              {results.score}%
            </div>
            <p className="text-muted-foreground">
              You got {correctAnswers} out of {questions.length} questions correct
            </p>
            {results.passed && (
              <p className="text-green-600 font-medium mt-2">
                {results.certificateGenerated ? 'Certificate generated!' : 'Generating certificate...'}
              </p>
            )}
          </div>

          <div className="space-y-3">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correct_answer;
              const options = [question.option_1, question.option_2, question.option_3, question.option_4];

              return (
                <div key={question.id} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">
                        {index + 1}. {question.question_text}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">
                        Your answer: {options[userAnswer - 1]}
                      </p>
                      {!isCorrect && (
                        <p className="text-xs text-green-600 mb-1">
                          Correct: {options[question.correct_answer - 1]}
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-xs text-muted-foreground">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={onCancel} variant="outline">
              Back to Course
            </Button>
            <Button onClick={handleComplete}>
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Question display
  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No questions available for this assessment.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];
  const options = [question.option_1, question.option_2, question.option_3, question.option_4];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{courseName} Assessment</CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question_text}</h3>
          
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={(index + 1).toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex justify-between">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleNext}
            disabled={selectedAnswer === '' || submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Submitting...
              </>
            ) : (
              currentQuestion < questions.length - 1 ? 'Next Question' : 'Submit Assessment'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleAssessment;