
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
      
      console.log('useSubscription - Fetch started:', {
        hasUser: !!user,
        isAuthenticated,
        supabaseUserId,
        userEmail: user?.primaryEmailAddress?.emailAddress
      });
      
      if (!user || !supabaseUserId) {
        console.log('useSubscription - Missing user or supabaseUserId:', { 
          user: !!user, 
          supabaseUserId,
          isAuthenticated 
        });
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        console.log('useSubscription - Querying database for user:', supabaseUserId);
        
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', supabaseUserId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('useSubscription - Database error:', error);
          setSubscription(null);
          setLoading(false);
          return;
        }

        console.log('useSubscription - Database response:', {
          data,
          dataLength: data?.length || 0,
          firstItem: data?.[0] || null
        });

        if (data && data.length > 0) {
          const sub = data[0];
          setSubscription(sub);
          console.log('useSubscription - Found subscription:', {
            id: sub.id,
            userId: sub.user_id,
            planType: sub.plan_type,
            status: sub.status,
            periodStart: sub.current_period_start,
            periodEnd: sub.current_period_end,
            isExpired: new Date(sub.current_period_end) <= new Date()
          });
        } else {
          console.log('useSubscription - No active subscription found');
          setSubscription(null);
        }
      } catch (error) {
        console.error('useSubscription - Fetch error:', error);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSubscription();
    }, 100);

    return () => clearTimeout(timer);
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
    if (!subscription) {
      console.log('hasProPlan - No subscription found');
      return false;
    }
    
    const isActive = subscription.status === 'active';
    const isNotExpired = new Date(subscription.current_period_end) > new Date();
    const isProPlan = subscription.plan_type === 'pro' || subscription.plan_type === 'enterprise';
    
    console.log('hasProPlan - Detailed check:', {
      hasSubscription: !!subscription,
      subscriptionId: subscription.id,
      userId: subscription.user_id,
      status: subscription.status,
      planType: subscription.plan_type,
      isActive,
      currentDate: new Date().toISOString(),
      periodEnd: subscription.current_period_end,
      isNotExpired,
      isProPlan,
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
