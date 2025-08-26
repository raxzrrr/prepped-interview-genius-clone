import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import PricingSection from '@/components/Home/PricingSection';

const PricingPage = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Choose Your <span className="text-primary">Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Select the perfect plan for your interview preparation needs. 
              Upgrade or downgrade anytime with flexible billing options.
            </p>
          </div>
          
          <PricingSection />
          
          {/* FAQ Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Can I cancel anytime?
                </h3>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time. Your access will continue 
                  until the end of your current billing period.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  What payment methods do you accept?
                </h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, UPI, and net banking through 
                  our secure payment partner Razorpay.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Is there a free trial?
                </h3>
                <p className="text-muted-foreground">
                  Our Basic plan is completely free and includes essential features to get you started. 
                  You can upgrade to Pro anytime to unlock advanced capabilities.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Do you offer student discounts?
                </h3>
                <p className="text-muted-foreground">
                  Yes! Please contact our support team with your student ID for special pricing options.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PricingPage;