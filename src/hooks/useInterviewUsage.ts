
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InterviewUsage {
  id: string;
  user_id: string;
  free_interview_used: boolean;
  usage_count: number;
  last_interview_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useInterviewUsage = () => {
  const [usage, setUsage] = useState<InterviewUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const { getSupabaseUserId, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchUsage = async () => {
      const supabaseUserId = getSupabaseUserId();
      
      if (!isAuthenticated || !supabaseUserId) {
        setUsage(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_interview_usage')
          .select('*')
          .eq('user_id', supabaseUserId)
          .single();

        if (error && error.code === 'PGRST116') {
          // No record exists, create one
          const { data: newUsage, error: insertError } = await supabase
            .from('user_interview_usage')
            .insert({
              user_id: supabaseUserId,
              free_interview_used: false,
              usage_count: 0
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating usage record:', insertError);
            return;
          }

          setUsage(newUsage);
        } else if (error) {
          console.error('Error fetching usage:', error);
        } else {
          setUsage(data);
        }
      } catch (error) {
        console.error('Error in fetchUsage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [getSupabaseUserId, isAuthenticated]);

  const markFreeInterviewUsed = async () => {
    const supabaseUserId = getSupabaseUserId();
    if (!supabaseUserId || !usage) return;

    try {
      const { data, error } = await supabase
        .from('user_interview_usage')
        .update({
          free_interview_used: true,
          usage_count: usage.usage_count + 1,
          last_interview_date: new Date().toISOString()
        })
        .eq('user_id', supabaseUserId)
        .select()
        .single();

      if (error) {
        console.error('Error updating usage:', error);
        return;
      }

      setUsage(data);
    } catch (error) {
      console.error('Error in markFreeInterviewUsed:', error);
    }
  };

  const canUseFreeInterview = () => {
    return usage && !usage.free_interview_used;
  };

  return {
    usage,
    loading,
    canUseFreeInterview,
    markFreeInterviewUsed
  };
};
