
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Hero: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gray-50">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-brand-purple to-brand-blue" />
      </div>
      
      <div className="relative px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="space-y-8 animate-fadeIn">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              <span className="block">Master Your</span>
              <span className="block text-brand-purple">Interview Skills</span>
              <span className="block">With AI</span>
            </h1>
            
            <p className="max-w-lg text-xl text-gray-600">
              Revolutionize your interview preparation with our AI-powered platform. 
              Upload your resume, practice with personalized questions, and get real-time 
              feedback on your performance.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {!user ? (
                <>
                  <Button 
                    size="lg"
                    onClick={() => navigate('/register')}
                  >
                    Get Started
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                  </Button>
                </>
              ) : (
                <Button 
                  size="lg"
                  onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-lg shadow-xl animate-fadeIn">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                alt="Person in interview"
                className="object-cover w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="inline-flex items-center px-3 py-1 mb-3 text-xs font-medium text-white bg-brand-purple rounded-full">
                  AI-Powered
                </span>
                <h3 className="text-xl font-bold text-white">
                  Real-time Feedback & Analysis
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
