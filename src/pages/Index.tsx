
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/ClerkAuthContext';

const Index = () => {
  const { isAuthenticated, loading, profile } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-t-brand-purple border-r-transparent border-b-brand-purple border-l-transparent animate-spin"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }
  
  if (isAuthenticated && profile) {
    // Redirect authenticated users to their appropriate dashboard
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  
  // Redirect non-authenticated users to homepage
  return <Navigate to="/" replace />;
};

export default Index;
