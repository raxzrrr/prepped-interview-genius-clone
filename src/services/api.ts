
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
    const geminiApiKey = envService.get('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      toast({
        title: "API Key Required",
        description: "Please set up your Gemini API key in Settings to use this feature.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const generateInterviewQuestions = async (jobRole: string): Promise<InterviewQuestion[]> => {
    if (!checkApiKey()) return [];
    
    try {
      console.log("Generating interview questions for role:", jobRole);
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { type: 'interview-questions', prompt: jobRole }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }
      
      if (Array.isArray(data)) {
        return data.map((question, index) => ({
          id: `q-${index + 1}`,
          question
        }));
      }
      
      // If data is not an array or is invalid, throw error instead of using mock data
      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Error generating interview questions:', error);
      toast({
        title: "API Error",
        description: "Failed to generate interview questions. Please check your API configuration.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getAnswerFeedback = async (question: string, answer: string): Promise<AnswerFeedback | null> => {
    if (!checkApiKey()) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'feedback', 
          prompt: { question, answer } 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting answer feedback:', error);
      toast({
        title: "API Error",
        description: "Failed to analyze your answer. Please check your API configuration.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const analyzeFacialExpression = async (imageBase64: string): Promise<FacialAnalysis | null> => {
    if (!checkApiKey()) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { 
          type: 'facial-analysis', 
          prompt: { image: imageBase64 } 
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }
      
      return data;
    } catch (error) {
      console.error('Error analyzing facial expression:', error);
      toast({
        title: "API Error",
        description: "Failed to analyze facial expressions. Please check your API configuration.",
        variant: "destructive"
      });
      throw error;
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
      
      return data;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "API Error",
        description: "Failed to analyze resume. Please check your API configuration.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const saveInterview = async (interviewData: any): Promise<string> => {
    try {
      // Convert Clerk user ID to consistent UUID
      const supabaseUserId = generateConsistentUUID(interviewData.user_id);
      
      const dataWithUUID = {
        ...interviewData,
        user_id: supabaseUserId
      };
      
      const { data, error } = await supabase
        .from('interviews')
        .insert(dataWithUUID)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving interview:', error);
      toast({
        title: "Database Error",
        description: "Failed to save the interview. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateInterview = async (id: string, interviewData: any): Promise<void> => {
    try {
      const { error } = await supabase
        .from('interviews')
        .update(interviewData)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating interview:', error);
      toast({
        title: "Database Error",
        description: "Failed to update the interview. Please try again.",
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
