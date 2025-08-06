import { supabase } from '@/integrations/supabase/client';
import { questionService } from './questionService';
import { certificateTemplateService } from './certificateTemplateService';

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: number; // 1-4
  explanation?: string;
  difficulty_level: 'easy' | 'intermediate' | 'hard';
}

export interface AssessmentAnswer {
  questionId: string;
  selectedAnswer: number; // 1-4
}

export interface AssessmentResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number; // percentage
  passed: boolean;
  answers: AssessmentAnswer[];
}

export const assessmentService = {
  // Fetch questions for a course assessment
  async getAssessmentQuestions(courseId: string): Promise<AssessmentQuestion[]> {
    try {
      const questions = await questionService.fetchQuestionsByCourse(courseId);
      
      if (questions.length === 0) {
        throw new Error('No questions available for this course');
      }

      // Convert to assessment format
      return questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        option_1: q.option_1,
        option_2: q.option_2,
        option_3: q.option_3,
        option_4: q.option_4,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty_level: q.difficulty_level as 'easy' | 'intermediate' | 'hard'
      }));
    } catch (error) {
      console.error('Error fetching assessment questions:', error);
      throw error;
    }
  },

  // Calculate assessment results
  calculateResults(questions: AssessmentQuestion[], answers: AssessmentAnswer[]): AssessmentResult {
    let correctAnswers = 0;
    
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.correct_answer === answer.selectedAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= 70;

    return {
      totalQuestions: questions.length,
      correctAnswers,
      score,
      passed,
      answers
    };
  },

  // Save assessment results to database  
  async saveAssessmentResults(
    userId: string, 
    courseId: string, 
    result: AssessmentResult
  ): Promise<void> {
    try {
      // Generate consistent UUID for Supabase
      const generateConsistentUUID = (clerkUserId: string): string => {
        const cleanId = clerkUserId.replace(/^user_/, '');
        const paddedId = cleanId.padEnd(32, '0').substring(0, 32);
        return [
          paddedId.substring(0, 8),
          paddedId.substring(8, 12),
          paddedId.substring(12, 16),
          paddedId.substring(16, 20),
          paddedId.substring(20, 32)
        ].join('-');
      };

      const supabaseUserId = generateConsistentUUID(userId);

      // Update user_learning table with assessment results
      const { error } = await supabase
        .from('user_learning')
        .upsert({
          user_id: supabaseUserId,
          assessment_attempted: true,
          assessment_passed: result.passed,
          assessment_score: result.score,
          assessment_completed_at: result.passed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving assessment results:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveAssessmentResults:', error);
      throw error;
    }
  },

  // Generate certificate if assessment passed
  async generateCertificateIfPassed(
    userId: string,
    courseName: string,
    score: number
  ): Promise<void> {
    if (score < 70) {
      return; // Don't generate certificate if not passed
    }

    try {
      // Generate consistent UUID for Supabase
      const generateConsistentUUID = (clerkUserId: string): string => {
        const cleanId = clerkUserId.replace(/^user_/, '');
        const paddedId = cleanId.padEnd(32, '0').substring(0, 32);
        return [
          paddedId.substring(0, 8),
          paddedId.substring(8, 12),
          paddedId.substring(12, 16),
          paddedId.substring(16, 20),
          paddedId.substring(20, 32)
        ].join('-');
      };

      const supabaseUserId = generateConsistentUUID(userId);

      // Get the default certificate template
      const template = await certificateTemplateService.getDefaultTemplate();
      if (!template) {
        throw new Error('No certificate template available');
      }

      // Generate the certificate
      const certificateData = {
        templateId: template.id,
        userId: supabaseUserId,
        courseName: courseName,
        score: score,
        completionDate: new Date()
      };

      await certificateTemplateService.generateCertificate(certificateData);
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }
};