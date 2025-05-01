
import React from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignIn } from "@clerk/clerk-react";

const LoginPage: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  
  // Redirect if already logged in
  if (user) {
    if (isAdmin()) {
      return <Navigate to="/admin" />;
    } else if (isStudent()) {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return (
    <MainLayout>
      <div className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
            <p className="text-gray-600 mb-8 text-center">
              Welcome back! Sign in to your account to continue your interview preparation
            </p>
            <SignIn 
              signUpUrl="/register"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "mx-auto w-full",
                  card: "shadow-md rounded-lg border border-gray-200",
                  headerTitle: "text-2xl font-bold text-gray-900",
                  headerSubtitle: "text-gray-600",
                  formButtonPrimary: "bg-brand-purple hover:bg-brand-purple-dark text-white",
                  footerAction: "text-brand-purple hover:text-brand-purple-dark",
                  formField: "mb-4",
                  formFieldInput: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent",
                  formFieldLabel: "text-gray-700 block mb-1",
                }
              }}
            />
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Admin account: admin@interview.ai | Password: CurrentTempPass</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
