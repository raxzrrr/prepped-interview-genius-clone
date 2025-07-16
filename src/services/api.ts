
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/ClerkAuthContext";

interface InterviewQuestion {
  id?: string;
  question: string;
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

  const getApiKeys = async () => {
    const userId = getSupabaseUserId();
    if (!userId) {
      console.error('No user ID available for API key retrieval');
      return { geminiApiKey: null, googleTTSApiKey: null };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('gemini_api_key, google_tts_api_key')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching API keys:', error);
        return { geminiApiKey: null, googleTTSApiKey: null };
      }

      return {
        geminiApiKey: data?.gemini_api_key || null,
        googleTTSApiKey: data?.google_tts_api_key || null
      };
    } catch (error) {
      console.error('Error getting API keys:', error);
      return { geminiApiKey: null, googleTTSApiKey: null };
    }
  };

  const checkApiKey = async (): Promise<boolean> => {
    const { geminiApiKey } = await getApiKeys();
    
    console.log('API Key check result:', geminiApiKey ? 'Available' : 'Missing');
    
    if (!geminiApiKey) {
      console.error('No Gemini API key found in database');
      toast({
        title: "API Key Required",
        description: "Please set up your Gemini API key in Settings to use this feature.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('API key validation successful');
    return true;
  };

  const generateInterviewQuestions = async (jobRole: string): Promise<InterviewQuestion[]> => {
    if (!(await checkApiKey())) return [];
    
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      toast({
        title: "Authentication Required",
        description: "Please log in to use this feature.",
        variant: "destructive"
      });
      return [];
    }
    
    try {
      console.log("Generating interview questions for role:", jobRole);
      
      const userId = getSupabaseUserId();
      if (!userId) {
        throw new Error('Unable to get user ID');
      }
      
      console.log('Using user ID for request:', userId);
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'interview-questions', 
          prompt: jobRole,
          userId: userId
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
      
      if (Array.isArray(data)) {
        const questions = data.map((question, index) => ({
          id: `q-${index + 1}`,
          question: typeof question === 'string' ? question : question.question || 'Question unavailable'
        }));
        
        console.log('Successfully generated questions:', questions.length);
        return questions;
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
    if (!(await checkApiKey())) return null;
    
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      return null;
    }
    
    try {
      console.log('Getting feedback for question:', question.substring(0, 50) + '...');
      
      const userId = getSupabaseUserId();
      if (!userId) {
        throw new Error('Unable to get user ID');
      }
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'feedback', 
          prompt: { question, answer },
          userId: userId
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
    if (!(await checkApiKey())) return null;
    
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
      
      const userId = getSupabaseUserId();
      if (!userId) {
        throw new Error('Unable to get user ID');
      }
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'evaluation', 
          prompt: { question, answer: answerToEvaluate },
          userId: userId
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
    if (!(await checkApiKey())) return null;
    
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
      
      const userId = getSupabaseUserId();
      if (!userId) {
        throw new Error('Unable to get user ID');
      }
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'resume-analysis', 
          prompt: { resume: resumeBase64 },
          userId: userId
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

  return {
    generateInterviewQuestions,
    getAnswerFeedback,
    evaluateAnswer,
    analyzeResume
  };
};
