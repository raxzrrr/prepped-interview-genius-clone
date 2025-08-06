import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Award, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useInterviewApi } from '@/services/api';
import { learningService } from '@/services/learningService';
import { questionService, CourseQuestion } from '@/services/questionService';
import { certificateTemplateService } from '@/services/certificateTemplateService';

interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'intermediate' | 'hard';
  explanation: string;
}

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  
  const { toast } = useToast();
  const { user, getSupabaseUserId } = useAuth();
  const { generateInterviewQuestions } = useInterviewApi();

  useEffect(() => {
    if (isUnlocked) {
      loadCourseQuestions();
    }
  }, [isUnlocked, courseId]);

  const loadCourseQuestions = async () => {
    try {
      setGeneratingQuestions(true);
      const courseQuestions = await questionService.fetchQuestionsByCourse(courseId);
      
      if (courseQuestions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "This course doesn't have any assessment questions yet.",
          variant: "destructive"
        });
        return;
      }

      // Convert database questions to assessment format
      const assessmentQuestions: AssessmentQuestion[] = courseQuestions.map(q => ({
        id: q.id,
        question: q.question_text,
        options: [q.option_1, q.option_2, q.option_3, q.option_4],
        correctAnswer: q.correct_answer - 1, // Convert from 1-based to 0-based
        difficulty: q.difficulty_level === 'intermediate' ? 'easy' : q.difficulty_level as 'easy' | 'hard',
        explanation: q.explanation || 'No explanation provided.'
      }));

      // Mix easy and hard questions (10 easy, 10 hard if available)
      const easyQuestions = assessmentQuestions.filter(q => q.difficulty === 'easy');
      const hardQuestions = assessmentQuestions.filter(q => q.difficulty === 'hard');
      
      const selectedQuestions = [
        ...easyQuestions.slice(0, 10),
        ...hardQuestions.slice(0, 10)
      ];

      if (selectedQuestions.length < 10) {
        // If we don't have enough questions, use all available
        setQuestions(assessmentQuestions.slice(0, 20));
      } else {
        setQuestions(selectedQuestions);
      }

    } catch (error) {
      console.error('Error loading course questions:', error);
      toast({
        title: "Error Loading Questions",
        description: "Failed to load assessment questions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer === '') return;

    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: parseInt(selectedAnswer)
    }));

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer('');
    } else {
      calculateResults();
    }
  };

  const calculateResults = async () => {
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70;

    // Save assessment results
    try {
      const supabaseUserId = getSupabaseUserId();
      if (supabaseUserId) {
        await learningService.updateModuleProgress(
          supabaseUserId,
          {
            [courseId]: {
              assessment_attempted: true,
              assessment_passed: passed,
              assessment_score: score,
              assessment_completed_at: passed ? new Date().toISOString() : null
            }
          },
          0,
          0
        );
      }
    } catch (error) {
      console.error('Error saving assessment results:', error);
    }

    setShowResults(true);

    if (passed) {
      await generateCertificate(score);
      toast({
        title: "Congratulations!",
        description: `You passed the ${courseName} assessment with ${score}%! Your certificate has been generated.`,
      });
    } else {
      toast({
        title: "Assessment Not Passed",
        description: `You scored ${score}%. You need 70% or higher to pass. Please review the course content and try again.`,
        variant: "destructive"
      });
    }

    onComplete(passed, score);
  };

  const generateCertificate = async (score: number) => {
    try {
      const supabaseUserId = getSupabaseUserId();
      if (!supabaseUserId) {
        throw new Error('User not authenticated');
      }

      // Get the default certificate template
      const template = await certificateTemplateService.getDefaultTemplate();
      if (!template) {
        throw new Error('No certificate template available');
      }

      // Generate the certificate using the template service
      const certificateData = {
        templateId: template.id,
        userId: supabaseUserId,
        courseName: courseName,
        score: score,
        completionDate: new Date()
      };

      await certificateTemplateService.generateCertificate(certificateData);
      
      toast({
        title: "Certificate Generated!",
        description: "Your course completion certificate has been generated and saved to your account.",
      });
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: "Certificate Error",
        description: "Failed to generate certificate, but you've still passed the assessment!",
        variant: "destructive"
      });
    }
  };

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

  if (generatingQuestions) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple mb-4"></div>
          <p className="text-lg font-medium">Preparing your assessment...</p>
          <p className="text-sm text-gray-500 mt-2">This will just take a moment</p>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const correctAnswers = Object.keys(answers).filter(questionId => {
      const question = questions.find(q => q.id === questionId);
      return question && answers[questionId] === question.correctAnswer;
    }).length;

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70;

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            {passed ? (
              <Award className="h-16 w-16 text-green-600" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Congratulations!' : 'Assessment Not Passed'}
          </CardTitle>
          <CardDescription>
            {passed 
              ? 'You have successfully passed the course assessment!' 
              : 'You need 70% or higher to pass. Please review and try again.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {score}%
            </div>
            <p className="text-gray-600">
              {correctAnswers} out of {questions.length} questions correct
            </p>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              
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
                        <p className="font-medium">Q{index + 1}: {question.question}</p>
                        <Badge variant={question.difficulty === 'easy' ? 'secondary' : 'destructive'}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your answer: {question.options[userAnswer] || 'Not answered'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600">
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{question.explanation}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            {passed && (
              <Button onClick={() => window.location.href = '/student/certificates'}>
                View Certificates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-8">
          <p className="text-lg text-gray-600">No questions available</p>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{courseName} Assessment</CardTitle>
          <Badge variant={question.difficulty === 'easy' ? 'secondary' : 'destructive'}>
            {question.difficulty}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>
          
          <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
            {question.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
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
            onClick={handleNext}
            disabled={selectedAnswer === ''}
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Finish Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseAssessment;
