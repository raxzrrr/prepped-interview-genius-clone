import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSettings {
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
  pro_plan_price_inr: number;
}

export const usePaymentSettings = () => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.rpc('get_api_keys');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const apiData = data[0] as any;
          setSettings({
            razorpay_key_id: apiData.razorpay_key_id,
            razorpay_key_secret: apiData.razorpay_key_secret,
            pro_plan_price_inr: apiData.pro_plan_price_inr || 999
          });
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        setError('Failed to load payment settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};