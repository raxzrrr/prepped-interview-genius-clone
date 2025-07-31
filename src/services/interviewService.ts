import { supabase } from '@/integrations/supabase/client';

export interface InterviewSession {
  id: string;
  user_id: string;
  interview_type: 'basic_hr_technical' | 'role_based' | 'resume_based';
  question_count: number;
  job_role?: string;
  questions: string[];
  ideal_answers: string[];
  user_answers?: string[];
  evaluations?: any[];
  overall_score?: number;
  session_status: 'created' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface InterviewQuestionSet {
  questions: string[];
  ideal_answers: string[];
}

export interface BulkEvaluationResult {
  evaluations: Array<{
    question_number: number;
    user_answer: string;
    ideal_answer: string;
    score: number;
    remarks: string;
    score_breakdown: {
      correctness: number;
      completeness: number;
      depth: number;
      clarity: number;
    };
  }>;
  overall_statistics: {
    average_score: number;
    total_questions: number;
    strengths: string[];
    areas_for_improvement: string[];
    overall_grade: string;
    recommendation: string;
  };
}

class InterviewService {
  // Generate interview question set with ideal answers
  async generateInterviewSet(
    interviewType: 'basic_hr_technical' | 'role_based' | 'resume_based',
    questionCount: number,
    jobRole?: string,
    resumeBase64?: string
  ): Promise<InterviewQuestionSet> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: {
          type: 'generate-interview-set',
          interviewType,
          questionCount,
          jobRole,
          prompt: { resumeBase64 }
        }
      });

      if (error) throw error;
      return data as InterviewQuestionSet;
    } catch (error) {
      console.error('Error generating interview set:', error);
      throw error;
    }
  }

  // Generate HR and technical questions
  async generateHRTechnicalQuestions(questionCount: number): Promise<InterviewQuestionSet> {
    try {
      console.log('Calling generateHRTechnicalQuestions with count:', questionCount);
      
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: {
          type: 'generate-hr-technical',
          questionCount
        }
      });

      if (error) throw error;
      return data as InterviewQuestionSet;
    } catch (error) {
      console.error('Error generating HR technical questions:', error);
      throw error;
    }
  }

  // Bulk evaluate all answers
  async bulkEvaluateAnswers(
    questions: string[],
    userAnswers: string[],
    idealAnswers: string[]
  ): Promise<BulkEvaluationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: {
          type: 'bulk-evaluation',
          questions,
          answers: userAnswers,
          idealAnswers
        }
      });

      if (error) throw error;
      return data as BulkEvaluationResult;
    } catch (error) {
      console.error('Error in bulk evaluation:', error);
      throw error;
    }
  }

  // Create interview session
  async createInterviewSession(
    interviewType: 'basic_hr_technical' | 'role_based' | 'resume_based',
    questionCount: number,
    questions: string[],
    idealAnswers: string[],
    jobRole?: string
  ): Promise<InterviewSession> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          interview_type: interviewType,
          question_count: questionCount,
          job_role: jobRole,
          questions,
          ideal_answers: idealAnswers,
          session_status: 'created'
        })
        .select()
        .single();

      if (error) throw error;
      return data as InterviewSession;
    } catch (error) {
      console.error('Error creating interview session:', error);
      throw error;
    }
  }

  // Update interview session with answers
  async updateInterviewSession(
    sessionId: string,
    userAnswers: string[],
    evaluations: any[],
    overallScore: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('interview_sessions')
        .update({
          user_answers: userAnswers,
          evaluations,
          overall_score: overallScore,
          session_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating interview session:', error);
      throw error;
    }
  }

  // Get user's interview sessions
  async getUserInterviewSessions(): Promise<InterviewSession[]> {
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InterviewSession[];
    } catch (error) {
      console.error('Error fetching interview sessions:', error);
      throw error;
    }
  }

  // Legacy support for existing interview API
  async generateInterviewQuestions(jobRole: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: {
          type: 'interview-questions',
          prompt: jobRole
        }
      });

      if (error) throw error;
      return data as string[];
    } catch (error) {
      console.error('Error generating interview questions:', error);
      throw error;
    }
  }

  async evaluateAnswer(question: string, answer: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: {
          type: 'evaluation',
          question,
          answer
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  }
}

export const interviewService = new InterviewService();
export default interviewService;