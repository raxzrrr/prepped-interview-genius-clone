
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/ClerkAuthContext";

interface InterviewQuestion {
  id?: string;
  question: string;
}

interface InterviewQuestionData {
  questions: string[];
  expectedAnswers: string[];
}

interface InterviewSessionEvaluation {
  overallScore: number;
  overallGrade: string;
  recommendation: string;
  questionEvaluations: {
    questionNumber: number;
    question: string;
    candidateAnswer: string;
    expectedAnswer: string;
    result: string;
    score: number;
    feedback: string;
    improvements: string;
  }[];
  strengths: string[];
  criticalWeaknesses: string[];
  industryComparison: string;
  actionPlan: string;
}

interface AnswerFeedback {
  score: number;
  strengths: string[];
  areas_to_improve: string[];
  suggestion: string;
}

interface QuestionEvaluation {
  ideal_answer: string;
  evaluation_criteria: string[];
  score_breakdown: {
    clarity: number;
    relevance: number;
    depth: number;
    examples: number;
    overall: number;
  };
  feedback: string;
}

interface ResumeAnalysis {
  skills: string[];
  suggested_role: string;
  strengths: string[];
  areas_to_improve: string[];
  suggestions: string;
}

export const useInterviewApi = () => {
  const { toast } = useToast();
  const { getSupabaseUserId, isAuthenticated, user } = useAuth();


  const generateInterviewQuestions = async (jobRole: string): Promise<InterviewQuestionData> => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please log in to use this feature.",
        variant: "destructive"
      });
      return { questions: [], expectedAnswers: [] };
    }
    
    try {
      console.log("Generating interview questions for role:", jobRole);
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'interview-questions', 
          prompt: jobRole
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Edge function error');
      }
      
      if (!data) {
        throw new Error('No data received from API');
      }
      
      // Check if data has questions and expectedAnswers
      if (data.questions && data.expectedAnswers && Array.isArray(data.questions) && Array.isArray(data.expectedAnswers)) {
        console.log('Successfully generated professional questions:', data.questions.length);
        return data;
      }
      
      // Fallback for old array format
      if (Array.isArray(data)) {
        console.log('Received old format, converting...');
        return {
          questions: data.map(q => typeof q === 'string' ? q : q.question || 'Question unavailable'),
          expectedAnswers: data.map(() => 'No expected answer available')
        };
      }
      
      throw new Error('Invalid response format from API');
    } catch (error: any) {
      console.error('Error generating interview questions:', error);
      
      const errorMessage = error.message || 'Unknown error occurred';
      console.error('Detailed error:', errorMessage);
      
      toast({
        title: "API Error",
        description: `Failed to generate interview questions: ${errorMessage}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getAnswerFeedback = async (question: string, answer: string): Promise<AnswerFeedback | null> => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      return null;
    }
    
    try {
      console.log('Getting feedback for question:', question.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'feedback', 
          prompt: { question, answer }
        }
      });

      if (error) {
        console.error('Edge function error for feedback:', error);
        return null;
      }
      
      if (!data) {
        console.log('No feedback data received - continuing without feedback');
        return null;
      }
      
      console.log('Successfully received feedback');
      return data;
    } catch (error: any) {
      console.error('Error getting answer feedback:', error);
      return null;
    }
  };

  const evaluateAnswer = async (question: string, userAnswer: string): Promise<QuestionEvaluation | null> => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      return null;
    }
    
    try {
      console.log('Getting evaluation for question:', question.substring(0, 50) + '...');
      
      // Always send the question for evaluation, even if no answer was provided
      const answerToEvaluate = userAnswer && userAnswer.trim() !== '' && userAnswer !== 'Question skipped' && userAnswer !== 'No answer provided'
        ? userAnswer
        : 'No answer provided';
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'evaluation', 
          prompt: { question, answer: answerToEvaluate }
        }
      });

      if (error) {
        console.error('Edge function error for evaluation:', error);
        return null;
      }
      
      if (!data) {
        console.log('No evaluation data received');
        return null;
      }
      
      console.log('Successfully received evaluation');
      return data;
    } catch (error: any) {
      console.error('Error getting answer evaluation:', error);
      return null;
    }
  };

  const analyzeResume = async (resumeBase64: string): Promise<ResumeAnalysis | null> => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please log in to use this feature.",
        variant: "destructive"
      });
      return null;
    }
    
    try {
      console.log("Analyzing resume...");
      
      if (!resumeBase64.includes('application/pdf')) {
        throw new Error('Only PDF files are supported');
      }
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'resume-analysis', 
          prompt: { resume: resumeBase64 }
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('No analysis data received');
      }
      
      console.log('Successfully analyzed resume');
      return data;
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "API Error",
        description: `Failed to analyze resume: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const evaluateInterviewSession = async (questions: string[], answers: string[], expectedAnswers: string[]): Promise<InterviewSessionEvaluation | null> => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      return null;
    }
    
    try {
      console.log('Performing batch evaluation of interview session');
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'batch-evaluation', 
          prompt: { questions, answers, expectedAnswers }
        }
      });

      if (error) {
        console.error('Edge function error for batch evaluation:', error);
        throw new Error(error.message);
      }
      
      if (!data) {
        throw new Error('No evaluation data received');
      }
      
      console.log('Successfully received batch evaluation');
      return data;
    } catch (error: any) {
      console.error('Error evaluating interview session:', error);
      toast({
        title: "Evaluation Error",
        description: `Failed to evaluate interview: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    generateInterviewQuestions,
    getAnswerFeedback,
    evaluateAnswer,
    evaluateInterviewSession,
    analyzeResume
  };
};
