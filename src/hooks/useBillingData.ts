
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan_type: string;
  created_at: string;
  razorpay_payment_id: string;
}

interface BillingData {
  currentPlan: string | null;
  planRenewalDate: string | null;
  paymentMethods: any[];
  billingHistory: PaymentRecord[];
  loading: boolean;
  error: string | null;
}

export const useBillingData = (): BillingData => {
  const [billingData, setBillingData] = useState<BillingData>({
    currentPlan: null,
    planRenewalDate: null,
    paymentMethods: [],
    billingHistory: [],
    loading: true,
    error: null,
  });

  const { user, getSupabaseUserId, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!user || !isAuthenticated) {
        setBillingData(prev => ({
          ...prev,
          loading: false,
          error: 'User not authenticated'
        }));
        return;
      }

      const supabaseUserId = getSupabaseUserId();
      if (!supabaseUserId) {
        setBillingData(prev => ({
          ...prev,
          loading: false,
          error: 'User ID not available'
        }));
        return;
      }

      try {
        setBillingData(prev => ({ ...prev, loading: true, error: null }));

        // Fetch current subscription
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', supabaseUserId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
        }

        // Fetch payment history
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', supabaseUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (paymentsError) {
          console.error('Error fetching payments:', paymentsError);
        }

        const currentSubscription = subscriptionData?.[0] || null;
        
        setBillingData({
          currentPlan: currentSubscription?.plan_type || null,
          planRenewalDate: currentSubscription?.current_period_end || null,
          paymentMethods: [], // Razorpay doesn't store payment methods, so keeping empty
          billingHistory: paymentsData || [],
          loading: false,
          error: subscriptionError || paymentsError ? 'Error fetching billing data' : null,
        });

      } catch (error) {
        console.error('Error in fetchBillingData:', error);
        setBillingData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch billing data'
        }));
      }
    };

    fetchBillingData();
  }, [user, isAuthenticated, getSupabaseUserId]);

  return billingData;
};
