
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';

const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  
  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Get started with basic interview preparation",
      features: [
        "5 AI-generated interview questions",
        "Basic resume analysis",
        "Limited access to Learning Hub content",
        "1 interview practice session per week",
        "Basic performance reports"
      ],
      buttonText: "Get Started",
      popular: false,
      buttonVariant: "outline"
    },
    {
      name: "Pro",
      price: "$19.99",
      period: "per month",
      description: "Everything you need for interview success",
      features: [
        "Unlimited AI-generated interview questions",
        "Comprehensive resume analysis",
        "Full access to Learning Hub content",
        "Unlimited interview practice sessions",
        "Detailed performance reports with insights",
        "Facial expression analysis",
        "Interview recording & playback"
      ],
      buttonText: "Upgrade to Pro",
      popular: true,
      buttonVariant: "default"
    },
    {
      name: "Enterprise",
      price: "$49.99",
      period: "per month",
      description: "Advanced features for serious job seekers",
      features: [
        "Everything in Pro plan",
        "Priority support",
        "1-on-1 coaching session (30 min)",
        "Custom interview scenarios",
        "Industry-specific question banks",
        "Advanced analytics dashboard",
        "Downloadable resources & templates"
      ],
      buttonText: "Contact Sales",
      popular: false,
      buttonVariant: "outline"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Choose the plan that's right for your interview preparation needs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`relative p-8 bg-white border rounded-lg ${
                plan.popular 
                  ? 'border-brand-purple shadow-lg scale-105 z-10' 
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 px-4 py-1 -mt-2 -mr-2 text-xs font-semibold text-white bg-brand-purple rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-base font-medium text-gray-500">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>
              
              <ul className="mb-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <div className="flex-shrink-0 p-1 text-brand-purple">
                      <CheckIcon className="w-5 h-5" />
                    </div>
                    <p className="ml-3 text-gray-700">{feature}</p>
                  </li>
                ))}
              </ul>
              
              <Button
                variant={plan.buttonVariant as "default" | "outline"}
                className={`w-full ${plan.popular ? 'bg-brand-purple hover:bg-brand-lightPurple' : ''}`}
                onClick={() => navigate('/register')}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Need a custom plan for your organization?{' '}
            <a href="/contact" className="font-medium text-brand-purple hover:underline">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
