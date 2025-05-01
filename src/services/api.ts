
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

export const useInterviewApi = () => {
  const { toast } = useToast();

  const checkApiKey = (): boolean => {
    if (!envService.isConfigured('GEMINI_API_KEY')) {
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
      // First try using the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: { type: 'interview-questions', prompt: jobRole }
      });

      if (error) throw new Error(error.message);
      
      // If we got an array back, format it into question objects
      if (Array.isArray(data)) {
        return data.map((question, index) => ({
          id: `q-${index + 1}`,
          question
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error generating interview questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate interview questions. Please try again later.",
        variant: "destructive"
      });
      return [];
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

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      console.error('Error getting answer feedback:', error);
      toast({
        title: "Error",
        description: "Failed to analyze your answer. Please try again later.",
        variant: "destructive"
      });
      return null;
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

      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      console.error('Error analyzing facial expression:', error);
      toast({
        title: "Error",
        description: "Failed to analyze facial expressions. Please try again later.",
        variant: "destructive"
      });
      return null;
    }
  };

  const saveInterview = async (interviewData: any): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .insert(interviewData)
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving interview:', error);
      toast({
        title: "Error",
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
        title: "Error",
        description: "Failed to update the interview. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Error",
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
        title: "Error",
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
    saveInterview,
    updateInterview,
    getInterviews,
    getInterviewById
  };
};
