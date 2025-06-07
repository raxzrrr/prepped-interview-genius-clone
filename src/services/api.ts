
import { supabase } from "@/integrations/supabase/client";
import envService from "./env";
import { useToast } from "@/components/ui/use-toast";

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

  const checkApiKey = (): boolean => {
    envService.debugApiKey();
    
    const geminiApiKey = envService.get('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    
    console.log('API Key check result:', geminiApiKey ? 'Available' : 'Missing');
    
    if (!geminiApiKey) {
      console.error('No Gemini API key found in any source');
      toast({
        title: "API Key Required",
        description: "Please set up your Gemini API key in Settings to use this feature. Check both environment variables and Settings page.",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('API key validation successful');
    return true;
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
        description: `Failed to generate interview questions: ${errorMessage}. Please check your API configuration and network connection.`,
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
        description: `Failed to analyze resume: ${error.message}. Please check your API configuration.`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const saveInterview = async (interviewData: any): Promise<string> => {
    try {
      console.log('Saving interview with data:', interviewData);
      
      // Get current user session with more robust error handling
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!sessionData?.session?.user) {
        console.error('No authenticated user found');
        throw new Error('You must be logged in to save interviews. Please log in and try again.');
      }
      
      const userId = sessionData.session.user.id;
      console.log('Authenticated user ID:', userId);
      
      // Insert directly into interviews table with current user ID
      const { data, error } = await supabase
        .from('interviews')
        .insert({
          ...interviewData,
          user_id: userId
        })
        .select('id')
        .single();
          
      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (!data?.id) {
        throw new Error('No interview ID returned from database');
      }
      
      console.log('Successfully saved interview with ID:', data.id);
      return data.id;
    } catch (error: any) {
      console.error('Error saving interview:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save the interview. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateInterview = async (id: string, interviewData: any): Promise<void> => {
    try {
      console.log('Updating interview:', id, 'with data:', interviewData);
      
      // Get current user session with more robust error handling
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!sessionData?.session?.user) {
        console.error('No authenticated user found');
        throw new Error('You must be logged in to update interviews. Please log in and try again.');
      }
      
      const userId = sessionData.session.user.id;
      console.log('Authenticated user ID:', userId);

      const { error } = await supabase
        .from('interviews')
        .update(interviewData)
        .eq('id', id)
        .eq('user_id', userId); // Ensure user can only update their own interviews

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Successfully updated interview');
    } catch (error: any) {
      console.error('Error updating interview:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update the interview. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getInterviews = async (userId: string) => {
    try {
      console.log('Fetching interviews for user:', userId);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User must be logged in to fetch interviews');
      }
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Successfully fetched interviews:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Database Error",
        description: "Failed to fetch interviews. Please try again.",
        variant: "destructive"
      });
      return [];
    }
  };

  const getInterviewById = async (id: string) => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User must be logged in to fetch interview');
      }
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id) // Ensure user can only access their own interviews
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching interview:', error);
      toast({
        title: "Database Error",
        description: "Failed to fetch interview details. Please try again.",
        variant: "destructive"
      });
      return null;
    }
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
