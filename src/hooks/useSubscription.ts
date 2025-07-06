
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, getSupabaseUserId } = useAuth();

  useEffect(() => {
    const fetchSubscription = async () => {
      const supabaseUserId = getSupabaseUserId();
      
      if (!user || !supabaseUserId) {
        console.log('No user or supabaseUserId found:', { user: !!user, supabaseUserId });
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching subscription for supabaseUserId:', supabaseUserId);
        
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', supabaseUserId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching subscription:', error);
          return;
        }

        console.log('Subscription query result:', data);

        if (data && data.length > 0) {
          setSubscription(data[0]);
          console.log('Found active subscription:', data[0]);
        } else {
          console.log('No active subscription found');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user, getSupabaseUserId]);

  const hasActivePlan = (planType: string) => {
    if (!subscription) return false;
    
    const isActive = subscription.status === 'active';
    const isNotExpired = new Date(subscription.current_period_end) > new Date();
    
    return isActive && isNotExpired && subscription.plan_type === planType;
  };

  const hasAnyActivePlan = () => {
    if (!subscription) return false;
    
    const isActive = subscription.status === 'active';
    const isNotExpired = new Date(subscription.current_period_end) > new Date();
    
    return isActive && isNotExpired;
  };

  const hasProPlan = () => {
    if (!subscription) return false;
    
    const isActive = subscription.status === 'active';
    const isNotExpired = new Date(subscription.current_period_end) > new Date();
    
    // Check if user has pro or enterprise plan (both should have full access)
    const isProPlan = subscription.plan_type === 'pro' || subscription.plan_type === 'enterprise';
    
    console.log('Checking Pro plan access:', {
      hasSubscription: !!subscription,
      isActive,
      isNotExpired,
      isProPlan,
      planType: subscription.plan_type,
      finalResult: isActive && isNotExpired && isProPlan
    });
    
    return isActive && isNotExpired && isProPlan;
  };

  return {
    subscription,
    loading,
    hasActivePlan,
    hasAnyActivePlan,
    hasProPlan,
  };
};
