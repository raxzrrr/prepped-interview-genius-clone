import { supabase } from "@/integrations/supabase/client";
import envService from "./env";
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
  const { getSupabaseUserId, session, user, isAuthenticated, isLoaded } = useAuth();

  const checkApiKey = (): boolean => {
    // Wait for auth to load before checking API key
    if (!isLoaded) {
      console.log('Auth not loaded yet, waiting...');
      return false;
    }

    envService.debugApiKey();
    
    const geminiApiKey = envService.get('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    
    console.log('API Key check result:', geminiApiKey ? 'Available' : 'Missing');
    
    if (!geminiApiKey) {
      console.error('No Gemini API key found in any source');
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

  const makeSecureApiCall = async (endpoint: string, body: any) => {
    try {
      console.log(`Making secure API call to ${endpoint}`);
      
      // Get the current session token if available
      const sessionToken = session?.getToken ? await session.getToken() : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if we have a session token
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
        console.log('Added authorization header');
      }

      const { data, error } = await supabase.functions.invoke(endpoint, {
        body,
        headers
      });

      console.log(`Supabase function response for ${endpoint}:`, { data, error });

      if (error) {
        console.error(`Edge function error for ${endpoint}:`, error);
        throw new Error(error.message || `Edge function error: ${endpoint}`);
      }
      
      if (!data) {
        throw new Error(`No data received from ${endpoint}`);
      }

      return data;
    } catch (error: any) {
      console.error(`Error in ${endpoint}:`, error);
      throw error;
    }
  };

  const generateInterviewQuestions = async (jobRole: string): Promise<InterviewQuestion[]> => {
    if (!checkApiKey()) return [];
    
    try {
      console.log("Generating interview questions for role:", jobRole);
      
      const data = await makeSecureApiCall('gemini-interview', {
        type: 'interview-questions', 
        prompt: jobRole 
      });
      
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
    if (!checkApiKey()) return null;
    
    try {
      console.log('Getting feedback for question:', question.substring(0, 50) + '...');
      
      const data = await makeSecureApiCall('gemini-interview', {
        type: 'feedback', 
        prompt: { question, answer } 
      });

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
    if (!checkApiKey()) return null;
    
    try {
      console.log('Getting evaluation for question:', question.substring(0, 50) + '...');
      
      // Always send the question for evaluation, even if no answer was provided
      const answerToEvaluate = userAnswer && userAnswer.trim() !== '' && userAnswer !== 'Question skipped' && userAnswer !== 'No answer provided'
        ? userAnswer
        : 'No answer provided';
      
      const data = await makeSecureApiCall('gemini-interview', {
        type: 'evaluation', 
        prompt: { question, answer: answerToEvaluate } 
      });

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
    if (!checkApiKey()) return null;
    
    try {
      console.log("Analyzing resume...");
      
      if (!resumeBase64.includes('application/pdf')) {
        throw new Error('Only PDF files are supported');
      }
      
      const data = await makeSecureApiCall('gemini-interview', {
        type: 'resume-analysis', 
        prompt: { resume: resumeBase64 } 
      });

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
    analyzeResume,
    isReady: isLoaded && checkApiKey()
  };
};
