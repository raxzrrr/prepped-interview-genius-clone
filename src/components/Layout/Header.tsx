
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { useToast } from '@/components/ui/use-toast';

const Header: React.FC = () => {
  const { user, profile, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    try {
      console.log("Logout button clicked");
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MockInvi
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
              <Link to="/contact" className="text-gray-600 hover:text-brand-purple transition-colors">
                Contact
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
              <Link to="/jobs" className="text-gray-600 hover:text-brand-purple transition-colors">
                Jobs
              </Link>
              <Link to="/interview-resources" className="text-gray-600 hover:text-brand-purple transition-colors">
                Interview Guides
              </Link>
            </>
          )}
          
          {user && isAdmin() && (
            <>
              <Link to="/admin" className="text-gray-600 hover:text-brand-purple transition-colors">
                Admin Panel
              </Link>
              <Link to="/admin/user-management" className="text-gray-600 hover:text-brand-purple transition-colors">
                Manage Users
              </Link>
              <Link to="/admin/courses" className="text-gray-600 hover:text-brand-purple transition-colors">
                Manage Content
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="hidden md:inline text-sm font-medium text-gray-700">
                Hello, {profile?.full_name || 'User'}
              </span>
              <Button 
                variant="outline" 
                onClick={handleLogout}
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
