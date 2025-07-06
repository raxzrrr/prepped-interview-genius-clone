
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
  const { user, getSupabaseUserId, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchSubscription = async () => {
      const supabaseUserId = getSupabaseUserId();
      
      console.log('useSubscription fetchSubscription called:', {
        hasUser: !!user,
        isAuthenticated,
        supabaseUserId,
        userEmail: user?.primaryEmailAddress?.emailAddress
      });
      
      if (!user || !supabaseUserId || !isAuthenticated) {
        console.log('No user, supabaseUserId, or not authenticated:', { 
          user: !!user, 
          supabaseUserId,
          isAuthenticated 
        });
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
          setLoading(false);
          return;
        }

        console.log('Subscription query result:', data);

        if (data && data.length > 0) {
          setSubscription(data[0]);
          console.log('Found active subscription:', data[0]);
        } else {
          console.log('No active subscription found for user:', supabaseUserId);
          setSubscription(null);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure auth context is fully loaded
    const timer = setTimeout(() => {
      fetchSubscription();
    }, 100);

    return () => clearTimeout(timer);
  }, [user, getSupabaseUserId, isAuthenticated]);

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
    if (!subscription) {
      console.log('hasProPlan: No subscription found');
      return false;
    }
    
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
