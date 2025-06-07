import { supabase } from "@/integrations/supabase/client";
import envService from "./env";
import { useToast } from "@/components/ui/use-toast";
import { generateConsistentUUID } from "@/utils/userUtils";

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
    // Debug API key configuration
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
        throw new Error(error.message || 'Failed to get answer feedback');
      }
      
      if (!data) {
        throw new Error('No feedback data received');
      }
      
      console.log('Successfully received feedback');
      return data;
    } catch (error: any) {
      console.error('Error getting answer feedback:', error);
      // Don't throw error for feedback - just log it and return null
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
        throw new Error(error.message || 'Failed to analyze facial expression');
      }
      
      if (!data) {
        throw new Error('No facial analysis data received');
      }
      
      console.log('Successfully analyzed facial expression');
      return data;
    } catch (error: any) {
      console.error('Error analyzing facial expression:', error);
      // Don't throw error for facial analysis - just log it and return null
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
      
      // Convert Clerk user ID to consistent UUID
      const supabaseUserId = generateConsistentUUID(interviewData.user_id);
      console.log('Generated Supabase user ID:', supabaseUserId);
      
      const dataWithUUID = {
        ...interviewData,
        user_id: supabaseUserId
      };
      
      console.log('Inserting interview data:', dataWithUUID);
      
      const { data, error } = await supabase
        .from('interviews')
        .insert(dataWithUUID)
        .select('id')
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Successfully saved interview:', data);
      return data.id;
    } catch (error: any) {
      console.error('Error saving interview:', error);
      toast({
        title: "Database Error",
        description: `Failed to save the interview: ${error.message}. Please try again.`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateInterview = async (id: string, interviewData: any): Promise<void> => {
    try {
      console.log('Updating interview:', id, 'with data:', interviewData);
      
      const { error } = await supabase
        .from('interviews')
        .update(interviewData)
        .eq('id', id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Successfully updated interview');
    } catch (error: any) {
      console.error('Error updating interview:', error);
      toast({
        title: "Database Error",
        description: `Failed to update the interview: ${error.message}. Please try again.`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getInterviews = async (userId: string) => {
    try {
      // Convert Clerk user ID to consistent UUID
      const supabaseUserId = generateConsistentUUID(userId);
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
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
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
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
