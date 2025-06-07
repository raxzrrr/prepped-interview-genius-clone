import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  
  const handleAdminLogin = () => {
    navigate('/login?admin=true');
  };

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase">
              Interview Genius
            </h3>
            <p className="text-gray-600">
              Your AI-powered interview training platform for career success.
            </p>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/learning" className="text-gray-600 hover:text-brand-purple transition-colors">
                  Learning Hub
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-600 hover:text-brand-purple transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/guides" className="text-gray-600 hover:text-brand-purple transition-colors">
                  Interview Guides
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-brand-purple transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 hover:text-brand-purple transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-brand-purple transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-brand-purple transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-brand-purple transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 mt-8 border-t border-gray-200">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-center text-gray-600">
              &copy; {new Date().getFullYear()} Interview Genius. All rights reserved.
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleAdminLogin}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Admin Access
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
