
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
  const { getSupabaseUserId, isAuthenticated, ensureSupabaseSession } = useAuth();

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!isAuthenticated) {
        setUserCertificates([]);
        setAvailableCertificates([]);
        setLoading(false);
        return;
      }

      try {
        // Ensure Supabase session is established before querying RLS-protected tables
        await ensureSupabaseSession();
        
        const supabaseUserId = getSupabaseUserId();
        if (!supabaseUserId) {
          console.log('useCertificates - No Supabase user ID available');
          setUserCertificates([]);
          setAvailableCertificates([]);
          setLoading(false);
          return;
        }

        console.log('useCertificates - Fetching certificates for user:', supabaseUserId);
        
        // Fetch user's certificates with embedded certificate details
        const { data: userCerts, error: userError } = await supabase
          .from('user_certificates')
          .select(`
            *,
            certificates (*)
          `)
          .eq('user_id', supabaseUserId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (userError) {
          console.error('Error fetching user certificates:', userError);
          setUserCertificates([]);
        } else {
          console.log('useCertificates - Found user certificates:', userCerts);
          
          // Handle cases where the join might not work perfectly
          const processedCerts = await Promise.all(
            (userCerts || []).map(async (cert) => {
              if (!cert.certificates) {
                // Fallback: fetch certificate details separately
                const { data: certDetails } = await supabase
                  .from('certificates')
                  .select('*')
                  .eq('id', cert.certificate_id)
                  .single();
                
                return {
                  ...cert,
                  certificates: certDetails || {
                    id: cert.certificate_id,
                    title: 'Certificate',
                    description: 'Course completion certificate',
                    certificate_type: 'completion',
                    template_data: {},
                    requirements: {},
                    is_active: true,
                    auto_issue: false,
                    created_at: cert.created_at,
                    updated_at: cert.updated_at
                  }
                };
              }
              return cert;
            })
          );
          
          setUserCertificates(processedCerts);
        }

        // Fetch available certificates
        const { data: availableCerts, error: availableError } = await supabase
          .from('certificates')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (availableError) {
          console.error('Error fetching available certificates:', availableError);
          setAvailableCertificates([]);
        } else {
          setAvailableCertificates(availableCerts || []);
        }
      } catch (error) {
        console.error('Error in fetchCertificates:', error);
        setUserCertificates([]);
        setAvailableCertificates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();

    // Listen for auth state changes to refetch when session is ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || (event === 'TOKEN_REFRESHED' && session)) {
        console.log('useCertificates - Auth state changed, refetching certificates');
        fetchCertificates();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [getSupabaseUserId, isAuthenticated, ensureSupabaseSession]);

  const refetch = () => {
    setLoading(true);
    // Trigger useEffect to run again
    const event = new Event('refetch-certificates');
    window.dispatchEvent(event);
  };

  return {
    userCertificates,
    availableCertificates,
    loading,
    refetch
  };
};
