import { supabase } from '@/integrations/supabase/client';

export interface InterviewReportData {
  id: string;
  userId: string;
  interviewType: string;
  jobRole?: string;
  questions: string[];
  answers: string[];
  evaluations: any[];
  overallScore: number;
  overallGrade: string;
  recommendation: string;
  reportData: any;
  createdAt: string;
  updatedAt: string;
}

export const reportsService = {
  async getAllReports(userId: string): Promise<InterviewReportData[]> {
    const { data, error } = await supabase
      .from('interview_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      throw new Error('Failed to fetch reports');
    }

    return data.map(report => ({
      id: report.id,
      userId: report.user_id,
      interviewType: report.interview_type,
      jobRole: report.job_role,
      questions: Array.isArray(report.questions) ? report.questions as string[] : [],
      answers: Array.isArray(report.answers) ? report.answers as string[] : [],
      evaluations: Array.isArray(report.evaluations) ? report.evaluations as any[] : [],
      overallScore: report.overall_score,
      overallGrade: report.overall_grade,
      recommendation: report.recommendation,
      reportData: report.report_data || {},
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }));
  },

  async getReportById(reportId: string, userId: string): Promise<InterviewReportData | null> {
    const { data, error } = await supabase
      .from('interview_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      interviewType: data.interview_type,
      jobRole: data.job_role,
      questions: Array.isArray(data.questions) ? data.questions as string[] : [],
      answers: Array.isArray(data.answers) ? data.answers as string[] : [],
      evaluations: Array.isArray(data.evaluations) ? data.evaluations as any[] : [],
      overallScore: data.overall_score,
      overallGrade: data.overall_grade,
      recommendation: data.recommendation,
      reportData: data.report_data || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async deleteReport(reportId: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('interview_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting report:', error);
      return false;
    }

    return true;
  },

  async createReport(reportData: Omit<InterviewReportData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    const { data, error } = await supabase
      .from('interview_reports')
      .insert({
        user_id: reportData.userId,
        interview_type: reportData.interviewType,
        job_role: reportData.jobRole,
        questions: reportData.questions,
        answers: reportData.answers,
        evaluations: reportData.evaluations,
        overall_score: reportData.overallScore,
        overall_grade: reportData.overallGrade,
        recommendation: reportData.recommendation,
        report_data: reportData.reportData
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return null;
    }

    return data.id;
  }
};