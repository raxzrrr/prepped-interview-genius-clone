
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
            Interview Genius
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-600 hover:text-brand-purple transition-colors">
            Home
          </Link>
          
          {!user && (
            <>
              <Link to="/about" className="text-gray-600 hover:text-brand-purple transition-colors">
                About
              </Link>
              <Link to="/pricing" className="text-gray-600 hover:text-brand-purple transition-colors">
                Pricing
              </Link>
            </>
          )}
          
          {user && isStudent() && (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-brand-purple transition-colors">
                Dashboard
              </Link>
              <Link to="/learning" className="text-gray-600 hover:text-brand-purple transition-colors">
                Learning Hub
              </Link>
              <Link to="/interviews" className="text-gray-600 hover:text-brand-purple transition-colors">
                My Interviews
              </Link>
            </>
          )}
          
          {user && isAdmin() && (
            <>
              <Link to="/admin" className="text-gray-600 hover:text-brand-purple transition-colors">
                Admin Panel
              </Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-brand-purple transition-colors">
                Manage Users
              </Link>
              <Link to="/admin/content" className="text-gray-600 hover:text-brand-purple transition-colors">
                Manage Content
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline text-sm font-medium text-gray-700">
                Hello, {user.name}
              </span>
              <Button 
                variant="outline" 
                onClick={() => logout()}
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
