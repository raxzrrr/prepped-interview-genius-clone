import { supabase } from '@/integrations/supabase/client';
import { generateCertificatePDF, CertificateData } from './certificateService';

export interface ReportPDFData {
  reportId: string;
  userName: string;
  interviewType: string;
  jobRole?: string;
  overallScore: number;
  overallGrade: string;
  timestamp: string;
  questions: string[];
  answers: string[];
  evaluations: any[];
}

export const generateAndStorePDF = async (reportData: ReportPDFData, userId: string): Promise<string | null> => {
  try {
    // Generate PDF using the certificate service
    const certificateData: CertificateData = {
      userName: reportData.userName,
      certificateTitle: `Interview Report - ${reportData.interviewType}${reportData.jobRole ? ` (${reportData.jobRole})` : ''}`,
      completionDate: new Date(reportData.timestamp).toLocaleDateString(),
      score: reportData.overallScore,
      verificationCode: reportData.reportId.slice(-8).toUpperCase()
    };

    const pdf = generateCertificatePDF(certificateData);
    const pdfBlob = pdf.output('blob');

    // Create file path
    const fileName = `${userId}/${reportData.reportId}.pdf`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('interview-reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('interview-reports')
      .getPublicUrl(fileName);

    // Update the report with PDF URL
    const { error: updateError } = await supabase
      .from('interview_reports')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', reportData.reportId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating report with PDF URL:', updateError);
      return null;
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error generating and storing PDF:', error);
    return null;
  }
};

export const downloadStoredPDF = async (pdfUrl: string, reportId: string) => {
  try {
    const response = await fetch(pdfUrl);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-report-${reportId.slice(-8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};