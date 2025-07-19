import { supabase } from '@/integrations/supabase/client';

export interface CourseQuestion {
  id: string;
  course_id: string;
  question_text: string;
  difficulty_level: 'easy' | 'intermediate' | 'hard';
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: number;
  explanation?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionData {
  course_id: string;
  question_text: string;
  difficulty_level: 'easy' | 'intermediate' | 'hard';
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  correct_answer: number;
  explanation?: string;
  order_index: number;
}

export const questionService = {
  async fetchQuestionsByCourse(courseId: string): Promise<CourseQuestion[]> {
    const { data, error } = await supabase
      .from('course_questions')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }

    return (data || []) as CourseQuestion[];
  },

  async addQuestion(questionData: CreateQuestionData): Promise<CourseQuestion> {
    const { data, error } = await supabase
      .from('course_questions')
      .insert([questionData])
      .select()
      .single();

    if (error) {
      console.error('Error adding question:', error);
      throw error;
    }

    return data as CourseQuestion;
  },

  async updateQuestion(questionId: string, updates: Partial<CourseQuestion>): Promise<CourseQuestion> {
    const { data, error } = await supabase
      .from('course_questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating question:', error);
      throw error;
    }

    return data as CourseQuestion;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('course_questions')
      .update({ is_active: false })
      .eq('id', questionId);

    if (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  async reorderQuestions(courseId: string, questionIds: string[]): Promise<void> {
    const updates = questionIds.map((id, index) => ({
      id,
      order_index: index
    }));

    for (const update of updates) {
      await supabase
        .from('course_questions')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }
  }
};