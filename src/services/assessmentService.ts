import { supabase } from '@/integrations/supabase/client';
import { questionService } from './questionService';
import { certificateTemplateService } from './certificateTemplateService';
import { generateConsistentUUID } from '@/utils/userUtils';

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

  // Calculate assessment results using learning-service
  async calculateResults(courseId: string, userAnswers: AssessmentAnswer[]): Promise<AssessmentResult> {
    try {
      // Call learning-service to evaluate assessment
      const { data, error } = await supabase.functions.invoke('learning-service', {
        body: {
          action: 'evaluateAssessment',
          clerkUserId: 'temp-user-id', // This will be replaced with actual user ID when called
          data: {
            courseId: courseId
          },
          questions: [], // Will be fetched by the service
          answers: userAnswers
        }
      });

      if (error) {
        console.error('Error evaluating assessment:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Assessment evaluation failed');
      }

      return {
        totalQuestions: data.data.totalQuestions,
        correctAnswers: data.data.correctAnswers,
        score: data.data.score,
        passed: data.data.passed,
        answers: userAnswers
      };
    } catch (error) {
      console.error('Error in calculateResults:', error);
      throw error;
    }
  },

  // Evaluate and save assessment results using learning-service  
  async evaluateAndSaveAssessment(
    userId: string, 
    courseId: string, 
    courseName: string,
    userAnswers: AssessmentAnswer[],
    totalModules?: number
  ): Promise<AssessmentResult & { certificateGenerated?: boolean }> {
    try {
      console.log('Evaluating assessment for user:', userId, 'course:', courseId);
      
      // Call learning-service edge function to evaluate and save assessment
      const { data, error } = await supabase.functions.invoke('learning-service', {
        body: {
          action: 'evaluateAssessment',
          clerkUserId: userId,
          data: {
            courseId: courseId,
            courseName: courseName
          },
          totalModules,
          questions: [], // Will be fetched by the service
          answers: userAnswers
        }
      });

      if (error) {
        console.error('Error calling learning-service for assessment evaluation:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Assessment evaluation failed');
      }

      const result = {
        totalQuestions: data.data.totalQuestions,
        correctAnswers: data.data.correctAnswers,
        score: data.data.score,
        passed: data.data.passed,
        certificateGenerated: data.data.certificateGenerated || false,
        answers: userAnswers
      };

      console.log('Assessment evaluated and saved successfully via learning-service');
      return result;
    } catch (error) {
      console.error('Error in evaluateAndSaveAssessment:', error);
      throw error;
    }
  },

  // Generate certificate if user passed using default template from certificates table
  async generateCertificateIfPassed(
    userId: string,
    courseId: string,
    courseName: string,
    score: number
  ): Promise<void> {
    const PASSING_SCORE = 70;
    
    if (score >= PASSING_SCORE) {
      try {
        const supabaseUserId = generateConsistentUUID(userId);

        // Get default certificate from certificates table
        const { data: defaultCertificate, error: certError } = await supabase
          .from('certificates')
          .select('*')
          .eq('is_active', true)
          .eq('certificate_type', 'completion')
          .single();

        if (certError || !defaultCertificate) {
          console.warn('No default certificate found, using template fallback');
          await this.generateCertificateWithTemplate(supabaseUserId, courseId, courseName, score);
          return;
        }

        // Get user details
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', supabaseUserId)
          .single();

        if (userError || !userProfile) {
          throw new Error('User not found');
        }

        // Generate verification code
        const verificationCode = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        // Save to user_certificates table
        const { error: saveError } = await supabase
          .from('user_certificates')
          .insert({
            user_id: supabaseUserId,
            certificate_id: defaultCertificate.id,
            verification_code: verificationCode,
            score: score,
            completion_data: {
              course_id: courseId,
              course_name: courseName,
              completion_date: new Date().toISOString(),
              score: score,
              passing_score: 70,
              user_name: userProfile.full_name
            },
            is_active: true
          });

        if (saveError) {
          throw saveError;
        }

        console.log('Certificate generated and saved successfully');
      } catch (error) {
        console.error('Error generating certificate:', error);
        throw error;
      }
    }
  },

  // Fallback method using certificate templates
  async generateCertificateWithTemplate(
    userId: string,
    courseId: string,
    courseName: string,
    score: number
  ): Promise<void> {
    try {
      // Get default certificate template
      const defaultTemplate = await certificateTemplateService.getDefaultTemplate();
      
      if (!defaultTemplate) {
        console.warn('No default certificate template found');
        return;
      }

      // Generate certificate with template
      const populatedHtml = await certificateTemplateService.generateCertificate({
        templateId: defaultTemplate.id,
        userId: userId,
        courseName: courseName,
        score: score,
        completionDate: new Date()
      });

      // Save to user_certificates table
      await certificateTemplateService.saveUserCertificate({
        userId: userId,
        templateId: defaultTemplate.id,
        courseName: courseName,
        score: score,
        populatedHtml: populatedHtml,
        completionData: {
          course_id: courseId,
          course_name: courseName,
          completion_date: new Date().toISOString(),
          score: score,
          passing_score: 70
        }
      });
    } catch (error) {
      console.error('Error with template fallback:', error);
      throw error;
    }
  }
};