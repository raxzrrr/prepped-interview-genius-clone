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
  async calculateResults(courseId: string, userAnswers: AssessmentAnswer[]): Promise<AssessmentResult> {
    // Fetch questions from backend
    const questions = await questionService.fetchQuestionsByCourse(courseId);
    
    if (questions.length === 0) {
      throw new Error('No questions found for this course');
    }

    let pointsEarned = 0;
    
    // Evaluate each question
    questions.forEach(question => {
      const userAnswer = userAnswers.find(answer => answer.questionId === question.id);
      
      // Check if answer is valid and correct
      if (userAnswer && 
          userAnswer.selectedAnswer >= 1 && 
          userAnswer.selectedAnswer <= 4 && 
          userAnswer.selectedAnswer === question.correct_answer) {
        pointsEarned++;
      }
      // Skipped or invalid answers count as incorrect (0 points)
    });

    const score = Math.round((pointsEarned / questions.length) * 100);
    const passed = score >= 70; // 70% passing threshold

    return {
      totalQuestions: questions.length,
      correctAnswers: pointsEarned,
      score,
      passed,
      answers: userAnswers
    };
  },

  // Save assessment results to database using learning-service  
  async saveAssessmentResults(
    userId: string, 
    courseId: string, 
    result: AssessmentResult
  ): Promise<void> {
    try {
      // Call learning-service edge function to save assessment results
      const { data, error } = await supabase.functions.invoke('learning-service', {
        body: {
          action: 'updateAssessment',
          clerkUserId: userId,
          data: {
            course_id: courseId,
            assessment_attempted: true,
            assessment_passed: result.passed,
            assessment_score: result.score,
            last_assessment_score: result.score,
            assessment_completed_at: result.passed ? new Date().toISOString() : null
          }
        }
      });

      if (error) {
        console.error('Error calling learning-service for assessment:', error);
        throw error;
      }

      console.log('Assessment results saved successfully via learning-service');
    } catch (error) {
      console.error('Error in saveAssessmentResults:', error);
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