
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface AssessmentQuizProps {
  onComplete: (score: number) => void;
  onClose: () => void;
}

const assessmentQuestions: Question[] = [
  {
    id: 'q1',
    question: 'What is the most important aspect of preparing for a technical interview?',
    options: [
      'Memorizing coding patterns',
      'Understanding the problem-solving approach',
      'Learning the company\'s tech stack',
      'Practicing whiteboard coding'
    ],
    correctAnswer: 1,
    explanation: 'Understanding the problem-solving approach is crucial as it demonstrates your analytical thinking and methodology.'
  },
  {
    id: 'q2',
    question: 'When answering behavioral questions, which framework is most effective?',
    options: [
      'PREP (Point, Reason, Example, Point)',
      'STAR (Situation, Task, Action, Result)',
      'DESC (Describe, Evaluate, Summarize, Conclude)',
      'SOAR (Situation, Obstacles, Actions, Results)'
    ],
    correctAnswer: 1,
    explanation: 'The STAR method provides a structured way to answer behavioral questions by covering all key aspects of your experience.'
  },
  {
    id: 'q3',
    question: 'What should you do if you don\'t know the answer to a technical question?',
    options: [
      'Make up an answer',
      'Say "I don\'t know" and stop',
      'Explain your thought process and ask clarifying questions',
      'Change the subject'
    ],
    correctAnswer: 2,
    explanation: 'Explaining your thought process shows problem-solving skills, and asking questions demonstrates engagement and curiosity.'
  },
  {
    id: 'q4',
    question: 'In system design interviews, what should you start with?',
    options: [
      'Database schema design',
      'Technology stack selection',
      'Clarifying requirements and constraints',
      'API endpoint design'
    ],
    correctAnswer: 2,
    explanation: 'Clarifying requirements and constraints ensures you\'re solving the right problem and helps guide your design decisions.'
  },
  {
    id: 'q5',
    question: 'What is the best way to handle nervousness during an interview?',
    options: [
      'Avoid eye contact to reduce pressure',
      'Speak quickly to get through questions faster',
      'Take deep breaths and pause to think',
      'Focus on impressing with complex vocabulary'
    ],
    correctAnswer: 2,
    explanation: 'Taking deep breaths and pausing to think helps you stay calm, organized, and gives thoughtful responses.'
  }
];

const AssessmentQuiz: React.FC<AssessmentQuizProps> = ({ onComplete, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswer(value);
  };

  const handleNext = () => {
    if (selectedAnswer !== '') {
      setAnswers(prev => ({
        ...prev,
        [assessmentQuestions[currentQuestion].id]: parseInt(selectedAnswer)
      }));
      
      if (currentQuestion < assessmentQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        // Quiz completed, show results
        setShowResults(true);
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    assessmentQuestions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / assessmentQuestions.length) * 100);
  };

  const handleComplete = () => {
    const score = calculateScore();
    onComplete(score);
  };

  if (showResults) {
    const score = calculateScore();
    const correctAnswers = Object.keys(answers).filter(questionId => {
      const question = assessmentQuestions.find(q => q.id === questionId);
      return question && answers[questionId] === question.correctAnswer;
    }).length;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Assessment Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{score}%</div>
            <p className="text-gray-600">
              You got {correctAnswers} out of {assessmentQuestions.length} questions correct
            </p>
          </div>
          
          <div className="space-y-4">
            {assessmentQuestions.map((question, index) => {
              const userAnswer = answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-1">Question {index + 1}: {question.question}</p>
                      <p className="text-sm text-gray-600 mb-1">
                        Your answer: {question.options[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600 mb-1">
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">{question.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
            <Button onClick={handleComplete}>
              Complete Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;
  const question = assessmentQuestions[currentQuestion];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Technical Interview Assessment</CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestion + 1} of {assessmentQuestions.length}</span>
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
          <Button 
            onClick={onClose} 
            variant="outline"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleNext}
            disabled={selectedAnswer === ''}
          >
            {currentQuestion < assessmentQuestions.length - 1 ? 'Next Question' : 'Finish Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentQuiz;
