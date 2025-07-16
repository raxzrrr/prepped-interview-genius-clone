
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

  console.log('ProtectedRoute - Clerk auth:', { isAuthenticated: clerkAuth.isAuthenticated, user: !!clerkAuth.user });
  console.log('ProtectedRoute - Manual auth:', { isAuthenticated: manualAuth.isAuthenticated, user: !!manualAuth.user, profile: manualAuth.profile });

  // Check loading state for both auth systems
  const isLoading = clerkAuth.loading || manualAuth.loading;
  
  // Check if user is authenticated with either system
  const isAuthenticated = clerkAuth.isAuthenticated || manualAuth.isAuthenticated;
  const user = clerkAuth.user || manualAuth.user;
  
  // Get role checking functions
  const isAdmin = () => clerkAuth.isAdmin() || manualAuth.isAdmin();
  const isStudent = () => clerkAuth.isStudent() || manualAuth.isStudent();

  console.log('ProtectedRoute - Final state:', { isLoading, isAuthenticated, hasUser: !!user, isAdmin: isAdmin(), isStudent: isStudent() });

  if (isLoading) {
    console.log('ProtectedRoute - Still loading');
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-t-brand-purple border-r-transparent border-b-brand-purple border-l-transparent animate-spin"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && !isAdmin()) {
    console.log('ProtectedRoute - Admin required but user is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'student' && !isStudent() && !isAdmin()) {
    console.log('ProtectedRoute - Student required but user has no valid role, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
