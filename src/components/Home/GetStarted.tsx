
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const GetStarted: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-20 bg-gradient-to-r from-brand-purple to-brand-blue">
      <div className="container px-4 mx-auto text-center">
        <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
          Ready to Transform Your Interview Skills?
        </h2>
        <p className="max-w-2xl mx-auto mb-8 text-xl text-white/80">
          Join thousands of professionals who have boosted their confidence and landed their dream jobs with Interview Genius.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => navigate('/register')}
            className="font-semibold"
          >
            Create Your Free Account
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate('/about')}
            className="text-white border-white hover:bg-white/10"
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GetStarted;
