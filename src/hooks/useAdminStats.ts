import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminStats {
  totalCourses: number;
  activeStudents: number;
  totalRevenue: number; // assumed in INR
  certificatesIssued: number;
  loading: boolean;
}

export const useAdminStats = (): AdminStats => {
  const [stats, setStats] = useState<AdminStats>({
    totalCourses: 0,
    activeStudents: 0,
    totalRevenue: 0,
    certificatesIssued: 0,
    loading: true,
  });

  const fetchStats = useCallback(async () => {
    try {
      // Courses count (active)
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('id', { head: true, count: 'exact' })
        .eq('is_active', true);

      // Active students count
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .eq('role', 'student')
        .eq('status', 'active');

      // Certificates issued
      const { count: certificatesCount } = await supabase
        .from('user_certificates')
        .select('id', { head: true, count: 'exact' });

      // Total revenue (sum of completed payments)
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('status', 'completed');

      const revenue = (paymentsData || []).reduce((sum, p: any) => sum + (p.amount || 0), 0);

      setStats((prev) => ({
        ...prev,
        totalCourses: coursesCount ?? 0,
        activeStudents: studentsCount ?? 0,
        certificatesIssued: certificatesCount ?? 0,
        totalRevenue: revenue,
        loading: false,
      }));
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Realtime updates for key tables
    const channel = supabase
      .channel('admin-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_certificates' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  return stats;
};
