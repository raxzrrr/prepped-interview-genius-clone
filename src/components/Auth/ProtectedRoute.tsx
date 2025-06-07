
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/ClerkAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, isAdmin, isStudent } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-t-brand-purple border-r-transparent border-b-brand-purple border-l-transparent animate-spin"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';

  if (!user && !isTempAdmin) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin() && !isTempAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'student' && !isStudent() && !isAdmin() && !isTempAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
