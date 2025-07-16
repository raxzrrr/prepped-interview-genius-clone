
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@/contexts/ClerkAuthContext';
import { useAuth as useManualAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const clerkAuth = useClerkAuth();
  const manualAuth = useManualAuth();

  // Check loading state for both auth systems
  const isLoading = clerkAuth.loading || manualAuth.loading;
  
  // Check if user is authenticated with either system
  const isAuthenticated = clerkAuth.isAuthenticated || manualAuth.isAuthenticated;
  const user = clerkAuth.user || manualAuth.user;
  
  // Get role checking functions
  const isAdmin = () => clerkAuth.isAdmin() || manualAuth.isAdmin();
  const isStudent = () => clerkAuth.isStudent() || manualAuth.isStudent();

  if (isLoading) {
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

export default ProtectedRoute;
