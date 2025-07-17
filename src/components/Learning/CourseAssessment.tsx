
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Award, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useInterviewApi } from '@/services/api';
import { downloadCertificate } from '@/services/certificateService';

interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'hard';
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
  const { generateInterviewQuestions } = useInterviewApi();

  useEffect(() => {
    if (isUnlocked) {
      generateAssessmentQuestions();
    }
  }, [isUnlocked, courseId]);

  const generateAssessmentQuestions = async () => {
    setGeneratingQuestions(true);
    try {
      // Generate questions using AI based on course content
      const easyPrompt = `Generate 10 easy multiple choice questions for ${courseName} course assessment. Each question should have 4 options with one correct answer.`;
      const hardPrompt = `Generate 10 difficult multiple choice questions for ${courseName} course assessment. Each question should have 4 options with one correct answer.`;
      
      // For demo purposes, using fallback questions
      // In production, you'd use the AI API to generate these
      const fallbackQuestions: AssessmentQuestion[] = [
        // Easy questions
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `easy_${i + 1}`,
          question: `Easy question ${i + 1} about ${courseName}`,
          options: [
            'Option A',
            'Option B (Correct)',
            'Option C',
            'Option D'
          ],
          correctAnswer: 1,
          difficulty: 'easy' as const,
          explanation: 'This is the correct answer because...'
        })),
        // Hard questions
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `hard_${i + 1}`,
          question: `Advanced question ${i + 1} about ${courseName}`,
          options: [
            'Complex Option A',
            'Complex Option B',
            'Complex Option C (Correct)',
            'Complex Option D'
          ],
          correctAnswer: 2,
          difficulty: 'hard' as const,
          explanation: 'This requires deep understanding of...'
        }))
      ];

      // Shuffle questions
      const shuffledQuestions = [...fallbackQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffledQuestions);
      
    } catch (error) {
      console.error('Error generating assessment questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate assessment questions. Please check your API key settings.",
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
      // Assessment completed
      calculateResults();
    }
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70;

    setShowResults(true);

    if (passed) {
      // Generate and download certificate
      generateCertificate(score);
    }

    onComplete(passed, score);
  };

  const generateCertificate = (score: number) => {
    try {
      const certificateData = {
        userName: 'Student', // In production, get from user context
        certificateTitle: `${courseName} Course Completion`,
        completionDate: new Date().toLocaleDateString(),
        score: score,
        verificationCode: `${courseId.toUpperCase()}-${Date.now().toString().slice(-8)}`
      };

      downloadCertificate(certificateData);
      
      toast({
        title: "Certificate Generated!",
        description: "Your course completion certificate has been downloaded.",
      });
    } catch (error) {
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
            Complete all course modules to unlock the assessment
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
          <p className="text-lg font-medium">Generating assessment questions...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
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
            {passed ? 'Congratulations!' : 'Assessment Incomplete'}
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

          <div className="space-y-4">
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
              Back to Course
            </Button>
            {!passed && (
              <Button onClick={() => window.location.reload()}>
                Retake Assessment
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
