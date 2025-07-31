
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Certificate {
  id: string;
  title: string;
  description: string | null;
  certificate_type: string;
  template_data: any;
  requirements: any;
  is_active: boolean;
  auto_issue: boolean;
  created_at: string;
  updated_at: string;
}

interface UserCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  issued_date: string;
  completion_data: any;
  certificate_url: string | null;
  verification_code: string;
  score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  certificates: Certificate;
}

export const useCertificates = () => {
  const [userCertificates, setUserCertificates] = useState<UserCertificate[]>([]);
  const [availableCertificates, setAvailableCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { getSupabaseUserId, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchCertificates = async () => {
      const supabaseUserId = getSupabaseUserId();
      
      if (!isAuthenticated || !supabaseUserId) {
        setUserCertificates([]);
        setAvailableCertificates([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch user's certificates
        const { data: userCerts, error: userError } = await supabase
          .from('user_certificates')
          .select(`
            *,
            certificates (*)
          `)
          .eq('user_id', supabaseUserId);

        if (userError) {
          console.error('Error fetching user certificates:', userError);
        } else {
          setUserCertificates(userCerts || []);
        }

        // Fetch available certificates
        const { data: availableCerts, error: availableError } = await supabase
          .from('certificates')
          .select('*')
          .eq('is_active', true);

        if (availableError) {
          console.error('Error fetching available certificates:', availableError);
        } else {
          setAvailableCertificates(availableCerts || []);
        }
      } catch (error) {
        console.error('Error in fetchCertificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [getSupabaseUserId, isAuthenticated]);

  return {
    userCertificates,
    availableCertificates,
    loading
  };
};
