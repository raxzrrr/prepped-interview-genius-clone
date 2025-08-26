import { supabase } from '@/integrations/supabase/client';
import { generateConsistentUUID } from '@/utils/userUtils';
import { generateCertificatePDF, CertificateData } from '@/services/certificateService';

export const certificateDownloadService = {
  async downloadCertificateForCourse(clerkUserId: string, courseId: string, courseName: string): Promise<void> {
    try {
      const userId = generateConsistentUUID(clerkUserId);
      
      // Fetch user certificate for this course
      const { data: userCert, error } = await supabase
        .from('v_user_certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching certificate:', error);
        throw new Error('Failed to fetch certificate');
      }

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      const userName = profile?.full_name || 'Student';

      if (userCert && userCert.completion_data) {
        // Use existing certificate data
        const certificateData: CertificateData = {
          userName: userName,
          certificateTitle: courseName,
          completionDate: new Date(userCert.issued_date).toLocaleDateString(),
          score: userCert.score || 0,
          verificationCode: userCert.verification_code
        };
        
        const pdf = generateCertificatePDF(certificateData);
        pdf.save(`${courseName}-Certificate.pdf`);
      } else {
        // Generate local certificate as fallback
        const certificateData: CertificateData = {
          userName: userName,
          certificateTitle: courseName,
          completionDate: new Date().toLocaleDateString(),
          score: 0,
          verificationCode: `TEMP-${Date.now()}`
        };
        
        const pdf = generateCertificatePDF(certificateData);
        pdf.save(`${courseName}-Certificate.pdf`);
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw error;
    }
  }
};