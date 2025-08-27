import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DashboardAnalytics {
  interviewCount: number;
  currentStreak: number;
  averageScore: number;
  certificateCount: number;
  lastInterviewDate: string | null;
  loading: boolean;
}

export const useDashboardAnalytics = (): DashboardAnalytics => {
  const { getSupabaseUserId, isAuthenticated } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    interviewCount: 0,
    currentStreak: 0,
    averageScore: 0,
    certificateCount: 0,
    lastInterviewDate: null,
    loading: true
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      const supabaseUserId = getSupabaseUserId();
      
      if (!isAuthenticated || !supabaseUserId) {
        setAnalytics(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        // Fetch interview usage data
        const { data: usageData } = await supabase
          .from('user_interview_usage')
          .select('usage_count, last_interview_date')
          .eq('user_id', supabaseUserId)
          .single();

        // Fetch interview reports for average score calculation
        const { data: reportsData } = await supabase
          .from('interview_reports')
          .select('overall_score, created_at')
          .eq('user_id', supabaseUserId)
          .order('created_at', { ascending: false });

        // Fetch user certificates
        const { data: certificatesData } = await supabase
          .from('user_certificates')
          .select('id')
          .eq('user_id', supabaseUserId)
          .eq('is_active', true);

        // Calculate average score
        let averageScore = 0;
        if (reportsData && reportsData.length > 0) {
          const totalScore = reportsData.reduce((sum, report) => sum + (report.overall_score || 0), 0);
          averageScore = Math.round(totalScore / reportsData.length);
        }

        // Calculate current streak (simplified - consecutive days with interviews)
        let currentStreak = 0;
        if (reportsData && reportsData.length > 0) {
          const today = new Date();
          const lastInterviewDate = new Date(reportsData[0].created_at);
          const daysDiff = Math.floor((today.getTime() - lastInterviewDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 1) {
            // If last interview was today or yesterday, start counting streak
            currentStreak = 1;
            let streakDate = new Date(lastInterviewDate);
            
            for (let i = 1; i < reportsData.length; i++) {
              const reportDate = new Date(reportsData[i].created_at);
              const daysBetween = Math.floor((streakDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysBetween <= 1) {
                currentStreak++;
                streakDate = reportDate;
              } else {
                break;
              }
            }
          }
        }

        setAnalytics({
          interviewCount: usageData?.usage_count || 0,
          currentStreak,
          averageScore,
          certificateCount: certificatesData?.length || 0,
          lastInterviewDate: usageData?.last_interview_date || null,
          loading: false
        });

      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        setAnalytics(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAnalytics();

    // Set up real-time subscription for user certificates
    const supabaseUserId = getSupabaseUserId();
    if (supabaseUserId) {
      const subscription = supabase
        .channel('dashboard-analytics')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_certificates',
            filter: `user_id=eq.${supabaseUserId}`
          },
          () => {
            console.log('Certificate change detected, refreshing analytics');
            fetchAnalytics();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'interview_reports',
            filter: `user_id=eq.${supabaseUserId}`
          },
          () => {
            console.log('Interview report change detected, refreshing analytics');
            fetchAnalytics();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_interview_usage',
            filter: `user_id=eq.${supabaseUserId}`
          },
          () => {
            console.log('Interview usage change detected, refreshing analytics');
            fetchAnalytics();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [getSupabaseUserId, isAuthenticated]);

  return analytics;
};