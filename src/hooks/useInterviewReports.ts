import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InterviewReport {
  id: string;
  timestamp: string;
  questions: string[];
  answers: string[];
  evaluations: any[];
  overallScore: number;
  overallGrade: string;
  recommendation: string;
  reportData: any;
  interviewType?: string;
  jobRole?: string;
}

export const useInterviewReports = () => {
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, getSupabaseUserId } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;
    
    const supabaseUserId = getSupabaseUserId();
    if (!supabaseUserId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_reports')
        .select('*')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading reports:', error);
        toast({
          title: "Error",
          description: "Failed to load interview reports",
          variant: "destructive",
        });
        return;
      }

      const formattedReports: InterviewReport[] = data.map(report => ({
        id: report.id,
        timestamp: report.created_at,
        questions: Array.isArray(report.questions) ? report.questions as string[] : [],
        answers: Array.isArray(report.answers) ? report.answers as string[] : [],
        evaluations: Array.isArray(report.evaluations) ? report.evaluations as any[] : [],
        overallScore: report.overall_score,
        overallGrade: report.overall_grade,
        recommendation: report.recommendation,
        reportData: report.report_data || {},
        interviewType: report.interview_type,
        jobRole: report.job_role
      }));

      setReports(formattedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "Error",
        description: "Failed to load interview reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async (reportData: Omit<InterviewReport, 'id' | 'timestamp'>) => {
    if (!user) return null;

    const supabaseUserId = getSupabaseUserId();
    if (!supabaseUserId) return null;

    try {
      const { data, error } = await supabase
        .from('interview_reports')
        .insert({
          user_id: supabaseUserId,
          interview_type: reportData.interviewType || 'custom',
          job_role: reportData.jobRole,
          questions: reportData.questions,
          answers: reportData.answers,
          evaluations: reportData.evaluations,
          overall_score: reportData.overallScore,
          overall_grade: reportData.overallGrade,
          recommendation: reportData.recommendation,
          report_data: reportData.reportData
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving report:', error);
        toast({
          title: "Error",
          description: "Failed to save interview report",
          variant: "destructive",
        });
        return null;
      }

      const newReport: InterviewReport = {
        id: data.id,
        timestamp: data.created_at,
        questions: Array.isArray(data.questions) ? data.questions as string[] : [],
        answers: Array.isArray(data.answers) ? data.answers as string[] : [],
        evaluations: Array.isArray(data.evaluations) ? data.evaluations as any[] : [],
        overallScore: data.overall_score,
        overallGrade: data.overall_grade,
        recommendation: data.recommendation,
        reportData: data.report_data || {},
        interviewType: data.interview_type,
        jobRole: data.job_role
      };

      setReports(prev => [newReport, ...prev]);
      
      toast({
        title: "Success",
        description: "Interview report saved successfully",
      });

      return newReport.id;
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: "Failed to save interview report",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!user) return;

    const supabaseUserId = getSupabaseUserId();
    if (!supabaseUserId) return;

    try {
      const { error } = await supabase
        .from('interview_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', supabaseUserId);

      if (error) {
        console.error('Error deleting report:', error);
        toast({
          title: "Error",
          description: "Failed to delete report",
          variant: "destructive",
        });
        return;
      }

      setReports(prev => prev.filter(report => report.id !== reportId));
      
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const getReportById = (reportId: string) => {
    return reports.find(report => report.id === reportId);
  };

  return {
    reports,
    loading,
    saveReport,
    deleteReport,
    getReportById,
    refreshReports: loadReports
  };
};