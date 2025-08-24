import { supabase } from '@/integrations/supabase/client';

export interface InterviewSession {
  id: string;
  user_id?: string;
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
    improvement_tips: string[];
  }>;
  overall_statistics: {
    average_score: number;
    total_questions: number;
    strengths: string[];
    critical_weaknesses: string[];
    overall_grade: string;
    harsh_but_helpful_feedback: string;
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
    idealAnswers: string[],
    resumeAnalysis?: any // Optional resume analysis for context
  ): Promise<BulkEvaluationResult> {
    try {
      console.log('Starting bulk evaluation with:', {
        questionsCount: questions.length,
        answersCount: userAnswers.length,
        idealAnswersCount: idealAnswers.length,
        hasResumeAnalysis: !!resumeAnalysis
      });

      // Validate inputs
      if (!questions.length || !userAnswers.length || !idealAnswers.length) {
        throw new Error('Missing required data for evaluation');
      }

      if (questions.length !== userAnswers.length || questions.length !== idealAnswers.length) {
        console.warn('Length mismatch detected, proceeding with minimum length');
        const minLength = Math.min(questions.length, userAnswers.length, idealAnswers.length);
        questions = questions.slice(0, minLength);
        userAnswers = userAnswers.slice(0, minLength);
        idealAnswers = idealAnswers.slice(0, minLength);
      }

      const { data, error } = await supabase.functions.invoke('gemini-interview', {
        body: {
          type: 'bulk-evaluation',
          questions,
          answers: userAnswers,
          idealAnswers,
          prompt: { resumeText: resumeAnalysis?.rawText || '' }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Evaluation service error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No evaluation data received');
      }

      console.log('Bulk evaluation completed successfully:', data);

      // Validate and sanitize the response
      const result = data as BulkEvaluationResult;
      
      // Ensure evaluations array exists and has proper structure
      if (!result.evaluations || !Array.isArray(result.evaluations)) {
        throw new Error('Invalid evaluation response structure');
      }

      // Ensure each evaluation has required fields
      result.evaluations.forEach((evaluation, index) => {
        if (!evaluation.score && evaluation.score !== 0) {
          evaluation.score = 0;
        }
        if (!evaluation.score_breakdown) {
          evaluation.score_breakdown = {
            correctness: 0,
            completeness: 0,
            depth: 0,
            clarity: 0
          };
        }
        if (!evaluation.remarks) {
          evaluation.remarks = 'No specific feedback provided';
        }
        if (!evaluation.improvement_tips || !Array.isArray(evaluation.improvement_tips)) {
          evaluation.improvement_tips = ['Focus on providing more detailed and specific examples'];
        }
      });

      // Ensure overall_statistics exists
      if (!result.overall_statistics) {
        const avgScore = result.evaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / result.evaluations.length;
        result.overall_statistics = {
          average_score: avgScore,
          total_questions: questions.length,
          strengths: ['Completed the interview'],
          critical_weaknesses: ['Need more specific examples'],
          overall_grade: avgScore >= 8 ? 'A' : avgScore >= 6 ? 'B' : avgScore >= 4 ? 'C' : 'D',
          harsh_but_helpful_feedback: 'Focus on providing more detailed responses',
          recommendation: 'Practice with specific examples and metrics'
        };
      }

      return result;
    } catch (error) {
      console.error('Error in bulk evaluation:', error);
      
      // Create fallback evaluation result instead of throwing
      const fallbackResult: BulkEvaluationResult = {
        evaluations: questions.map((question, index) => ({
          question_number: index + 1,
          user_answer: userAnswers[index] || 'No answer provided',
          ideal_answer: idealAnswers[index] || 'No ideal answer available',
          score: 0,
          remarks: 'Evaluation failed. Please try again.',
          score_breakdown: {
            correctness: 0,
            completeness: 0,
            depth: 0,
            clarity: 0
          },
          improvement_tips: ['Evaluation service temporarily unavailable. Please try again.']
        })),
        overall_statistics: {
          average_score: 0,
          total_questions: questions.length,
          strengths: ['Completed the interview'],
          critical_weaknesses: ['Evaluation failed'],
          overall_grade: 'N/A',
          harsh_but_helpful_feedback: 'Evaluation failed. Please try again.',
          recommendation: 'Please retry the evaluation process.'
        }
      };
      
      console.log('Returning fallback evaluation result');
      return fallbackResult;
    }
  }

  // Create interview session - simplified without authentication
  async createInterviewSession(
    interviewType: 'basic_hr_technical' | 'role_based' | 'resume_based',
    questionCount: number,
    questions: string[],
    idealAnswers: string[],
    jobRole?: string
  ): Promise<InterviewSession> {
    try {
      console.log('Creating interview session...');
      
      // Simple insert without authentication - user_id will default to generic UUID
      const { data, error } = await supabase
        .from('interview_sessions')
        .insert({
          interview_type: interviewType,
          question_count: questionCount,
          job_role: jobRole,
          questions,
          ideal_answers: idealAnswers,
          session_status: 'created'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating interview session:', error);
        throw new Error(`Failed to create interview session: ${error.message}`);
      }
      
      console.log('Interview session created successfully:', data);
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

  // Get all interview sessions (no user filtering)
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

  // Save interview report as PDF to user_reports table
  async saveInterviewReportPDF(
    userId: string,
    reportTitle: string,
    pdfBlob: Blob,
    metadata: any = {}
  ): Promise<void> {
    try {
      // Use the authenticated Supabase user id to satisfy RLS policies
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('Supabase auth error while getting user:', authError);
      }
      const authUserId = authData?.user?.id || null;

      if (!authUserId) {
        console.warn('No authenticated Supabase user; skipping report save to respect RLS.');
        return;
      }

      // Convert blob to base64 string for storage (bytea column accepts base64)
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64String = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { error } = await supabase
        .from('user_reports')
        .insert({
          user_id: authUserId,
          report_type: 'interview',
          title: reportTitle,
          pdf_data: base64String,
          metadata
        });

      if (error) {
        console.error('Error saving interview report PDF:', {
          message: (error as any).message,
          details: (error as any).details,
          hint: (error as any).hint,
          code: (error as any).code,
        });
        throw error;
      }
    } catch (error) {
      console.error('Failed to save interview report PDF:', error);
      throw error;
    }
  }
}

export const interviewService = new InterviewService();
export default interviewService;