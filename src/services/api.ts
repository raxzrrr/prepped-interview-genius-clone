
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

interface FacialAnalysis {
  primary_emotion: string;
  confidence_score: number;
  engagement_level: number;
  observations: string[];
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
  const { getSupabaseUserId, session, user, isAuthenticated } = useAuth();

  const checkApiKey = (): boolean => {
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

  const getCurrentUser = () => {
    try {
      console.log('Getting current user. Auth state:', {
        isAuthenticated,
        hasUser: !!user,
        hasSession: !!session,
        sessionActive: session?.isActive
      });

      if (!isAuthenticated || !user || !session?.isActive) {
        console.error('Authentication check failed:', {
          isAuthenticated,
          hasUser: !!user,
          hasSession: !!session,
          sessionActive: session?.isActive
        });
        throw new Error('No active session. Please log in again.');
      }
      
      const supabaseUserId = getSupabaseUserId();
      if (!supabaseUserId) {
        console.error('No Supabase user ID available');
        throw new Error('User ID not available. Please log in again.');
      }
      
      console.log('Valid session found for user:', supabaseUserId);
      return { id: supabaseUserId };
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Error",
        description: "Please log in again to continue.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const generateInterviewQuestions = async (jobRole: string): Promise<InterviewQuestion[]> => {
    if (!checkApiKey()) return [];
    
    try {
      console.log("Generating interview questions for role:", jobRole);
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { type: 'interview-questions', prompt: jobRole }
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
    if (!checkApiKey()) return null;
    
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

  const analyzeFacialExpression = async (imageBase64: string): Promise<FacialAnalysis | null> => {
    if (!checkApiKey()) return null;
    
    try {
      console.log('Analyzing facial expression...');
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'facial-analysis', 
          prompt: { image: imageBase64 } 
        }
      });

      if (error) {
        console.error('Edge function error for facial analysis:', error);
        return null;
      }
      
      if (!data) {
        console.log('No facial analysis data received');
        return null;
      }
      
      console.log('Successfully analyzed facial expression');
      return data;
    } catch (error: any) {
      console.error('Error analyzing facial expression:', error);
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

  // Mock functions that no longer save to database but return success for compatibility
  const saveInterview = async (interviewData: any): Promise<string> => {
    console.log('Mock saveInterview called with:', interviewData);
    // Generate a mock ID for compatibility
    return 'mock-interview-' + Date.now();
  };

  const updateInterview = async (interviewId: string, updateData: any): Promise<void> => {
    console.log('Mock updateInterview called with:', interviewId, updateData);
    // No-op for compatibility
  };

  const getInterviews = async (): Promise<any[]> => {
    console.log('Mock getInterviews called - returning empty array');
    // Return empty array since we're not storing interviews
    return [];
  };

  const getInterviewById = async (interviewId: string): Promise<any | null> => {
    console.log('Mock getInterviewById called with:', interviewId);
    // Return null since we're not storing interviews
    return null;
  };

  return {
    generateInterviewQuestions,
    getAnswerFeedback,
    analyzeFacialExpression,
    analyzeResume,
    saveInterview,
    updateInterview,
    getInterviews,
    getInterviewById
  };
};
