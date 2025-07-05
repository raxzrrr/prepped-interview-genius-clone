
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface RazorpayButtonProps {
  amount: number;
  planType: string;
  planName: string;
  buttonText: string;
  variant?: "default" | "outline";
  disabled?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  amount,
  planType,
  planName,
  buttonText,
  variant = "default",
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a plan",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-payment', {
        body: {
          action: 'create_order',
          amount,
          receipt: `receipt_${Date.now()}`,
        },
      });

      if (orderError) throw orderError;

      const options = {
        key: 'rzp_test_9WKG4ZjYWcO0j9', // This will be replaced with your actual key
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Interview Genius',
        description: `${planName} Plan Subscription`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            const { error: verifyError } = await supabase.functions.invoke('razorpay-payment', {
              body: {
                action: 'verify_payment',
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                user_id: user.id,
                plan_type: planType,
                amount,
                currency: orderData.currency,
              },
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Payment Successful!",
              description: `Welcome to ${planName} plan! Your subscription is now active.`,
            });

            // Refresh the page to update subscription status
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user.fullName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
        },
        theme: {
          color: '#8B5CF6',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={`w-full ${variant === "default" ? 'bg-brand-purple hover:bg-brand-lightPurple' : ''}`}
      onClick={handlePayment}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
};

export default RazorpayButton;
