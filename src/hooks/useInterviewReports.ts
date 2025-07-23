import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';

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
}

export const useInterviewReports = () => {
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = () => {
    setLoading(true);
    try {
      const savedReports = localStorage.getItem(`interview_reports_${user?.id}`);
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = (reportData: Omit<InterviewReport, 'id' | 'timestamp'>) => {
    if (!user) return;

    const newReport: InterviewReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...reportData
    };

    const updatedReports = [newReport, ...reports];
    setReports(updatedReports);
    
    try {
      localStorage.setItem(`interview_reports_${user.id}`, JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error saving report:', error);
    }
  };

  const deleteReport = (reportId: string) => {
    if (!user) return;

    const updatedReports = reports.filter(report => report.id !== reportId);
    setReports(updatedReports);
    
    try {
      localStorage.setItem(`interview_reports_${user.id}`, JSON.stringify(updatedReports));
    } catch (error) {
      console.error('Error deleting report:', error);
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