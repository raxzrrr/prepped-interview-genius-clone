
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

const SimpleProtectedRoute: React.FC<SimpleProtectedRouteProps> = ({ children, requiredRole }) => {
  const { loading, isAuthenticated, user, isAdmin, isStudent } = useSimpleAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-t-brand-purple border-r-transparent border-b-brand-purple border-l-transparent animate-spin"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'student' && !isStudent() && !isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default SimpleProtectedRoute;
