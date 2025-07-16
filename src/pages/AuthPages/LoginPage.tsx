
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignIn } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLoginForm from '@/components/Auth/AdminLoginForm';

const LoginPage: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin()) {
        navigate('/admin');
      } else if (isStudent()) {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, isStudent, navigate]);

  const handleAdminSuccess = () => {
    window.location.reload();
  };
  
  if (showAdminLogin) {
    return (
      <MainLayout>
        <div className="py-16 bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="container px-4 mx-auto">
            <AdminLoginForm 
              onSuccess={handleAdminSuccess}
              onCancel={() => setShowAdminLogin(false)}
            />
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
            <p className="text-gray-600 mb-8 text-center">
              Welcome back! Sign in to your account to continue
            </p>
            
            <Card>
              <CardHeader>
                <CardTitle>Sign In Options</CardTitle>
                <CardDescription>
                  Sign in with Google using Clerk or use admin access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Sign in with Google or create a new account using Clerk
                  </p>
                  <SignIn 
                    signUpUrl="/register"
                    afterSignInUrl="/dashboard"
                    appearance={{
                      elements: {
                        rootBox: "mx-auto w-full",
                        card: "shadow-none border-0 p-0",
                        headerTitle: "text-xl font-bold text-gray-900",
                        headerSubtitle: "text-gray-600 text-sm",
                        formButtonPrimary: "bg-brand-purple hover:bg-brand-purple-dark text-white",
                        footerAction: "text-brand-purple hover:text-brand-purple-dark",
                        formField: "mb-4",
                        formFieldInput: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent",
                        formFieldLabel: "text-gray-700 block mb-1",
                      }
                    }}
                  />
                </div>
                
                <div className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAdminLogin(true)}
                    className="w-full text-sm"
                  >
                    Admin Access
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Click to access admin features
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
