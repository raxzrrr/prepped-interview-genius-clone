
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const GetStarted = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleAdminLogin = () => {
    navigate('/login', { state: { isAdmin: true } });
  };

  return (
    <section className="py-12 md:py-24 bg-gray-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ready to Ace Your Next Interview?
            </h2>
            <p className="mx-auto max-w-3xl text-gray-600 md:text-xl/relaxed">
              Start practicing with our AI interview platform and gain the confidence you need to succeed.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleGetStarted} size="lg" className="bg-brand-purple hover:bg-brand-purple-dark">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={handleAdminLogin} variant="outline" size="lg">
              Admin Login
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetStarted;
