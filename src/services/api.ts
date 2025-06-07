
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
  const { getSupabaseUserId, session } = useAuth();

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
      const supabaseUserId = getSupabaseUserId();
      
      if (!supabaseUserId || !session) {
        console.error('No active session found');
        throw new Error('No active session. Please log in.');
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

  const saveInterview = async (interviewData: any): Promise<string> => {
    try {
      console.log('Saving interview with data:', interviewData);
      
      const user = getCurrentUser();
      console.log('Authenticated user ID:', user.id);
      
      // Ensure we have proper data structure with all required fields
      const dataToSave = {
        user_id: user.id,
        title: interviewData.title || `Interview - ${new Date().toLocaleDateString()}`,
        job_title: interviewData.job_title || '',
        company_name: interviewData.company_name || '',
        interview_type: interviewData.interview_type || 'general',
        duration: interviewData.duration || 15,
        focus_areas: Array.isArray(interviewData.focus_areas) ? interviewData.focus_areas : [],
        questions: Array.isArray(interviewData.questions) ? interviewData.questions : [],
        answers: Array.isArray(interviewData.answers) ? interviewData.answers : [],
        status: interviewData.status || 'in-progress',
        score: interviewData.score || null,
        facial_analysis: Array.isArray(interviewData.facial_analysis) ? interviewData.facial_analysis : [],
        completed_at: interviewData.completed_at || null,
        date: new Date().toISOString()
      };
      
      console.log('Final data structure for saving:', dataToSave);
      
      const { data, error } = await supabase
        .from('interviews')
        .insert(dataToSave)
        .select('id')
        .single();
          
      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Failed to save interview: ${error.message}`);
      }
      
      if (!data?.id) {
        throw new Error('No interview ID returned from database');
      }
      
      console.log('Successfully saved interview with ID:', data.id);
      toast({
        title: "Interview Saved",
        description: "Your interview has been saved successfully!",
      });
      
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
      
      const user = getCurrentUser();
      console.log('Authenticated user ID:', user.id);

      // Ensure proper data structure for update
      const updateData = {
        ...interviewData,
        answers: Array.isArray(interviewData.answers) ? interviewData.answers : [],
        facial_analysis: Array.isArray(interviewData.facial_analysis) ? interviewData.facial_analysis : [],
        updated_at: new Date().toISOString()
      };

      console.log('Update data structure:', updateData);

      const { error } = await supabase
        .from('interviews')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Failed to update interview: ${error.message}`);
      }
      
      console.log('Successfully updated interview');
      toast({
        title: "Interview Updated",
        description: "Your interview has been updated successfully!",
      });
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

  const getInterviews = async (): Promise<any[]> => {
    try {
      console.log('Fetching interviews...');
      
      const user = getCurrentUser();
      console.log('Fetching interviews for user:', user.id);
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to fetch interviews: ${error.message}`);
      }
      
      console.log('Successfully fetched interviews:', data?.length || 0);
      console.log('Interview data:', data);
      return data || [];
    } catch (error: any) {
      console.error('Error fetching interviews:', error);
      toast({
        title: "Database Error",
        description: error.message || "Failed to fetch interviews. Please try logging in again.",
        variant: "destructive"
      });
      return [];
    }
  };

  const getInterviewById = async (id: string) => {
    try {
      console.log('Fetching interview by ID:', id);
      
      const user = getCurrentUser();
      
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to fetch interview: ${error.message}`);
      }
      
      console.log('Successfully fetched interview:', data?.id);
      return data;
    } catch (error: any) {
      console.error('Error fetching interview:', error);
      toast({
        title: "Database Error",
        description: error.message || "Failed to fetch interview details. Please try logging in again.",
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
