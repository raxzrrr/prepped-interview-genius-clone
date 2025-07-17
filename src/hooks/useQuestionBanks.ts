
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QuestionBank {
  id: string;
  technology: string;
  category: string;
  questions: Array<{
    question: string;
    answer: string;
  }>;
  difficulty_level: string;
  total_questions: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useQuestionBanks = () => {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestionBanks = async () => {
      try {
        const { data, error } = await supabase
          .from('question_banks')
          .select('*')
          .eq('is_active', true)
          .order('technology');

        if (error) {
          console.error('Error fetching question banks:', error);
        } else {
          // Transform the data to match our interface
          const transformedData = (data || []).map(item => ({
            ...item,
            questions: Array.isArray(item.questions) 
              ? item.questions as Array<{question: string; answer: string}>
              : []
          }));
          setQuestionBanks(transformedData);
        }
      } catch (error) {
        console.error('Error in fetchQuestionBanks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionBanks();
  }, []);

  return {
    questionBanks,
    loading
  };
};
