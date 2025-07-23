
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
      <div className="py-16 bg-gradient-to-b from-gray-50 to-white min-h-screen flex items-center justify-center">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">
                Sign in to continue your interview preparation
              </p>
            </div>
            
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl font-bold text-gray-900">Sign In</CardTitle>
                <CardDescription className="text-gray-600">
                  Access your account and continue learning
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="clerk-signin-wrapper">
                  <SignIn 
                    signUpUrl="/register"
                    redirectUrl="/dashboard"
                    appearance={{
                      elements: {
                        formButtonPrimary: 
                          "bg-brand-purple hover:bg-brand-lightPurple text-white border-0 rounded-lg font-medium transition-colors",
                        card: "shadow-none border-0 bg-transparent",
                        headerTitle: "text-xl font-bold text-gray-900",
                        headerSubtitle: "text-gray-600",
                        socialButtonsBlockButton: 
                          "border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors",
                        socialButtonsBlockButtonText: "font-medium",
                        formFieldInput: 
                          "border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple",
                        formFieldLabel: "text-gray-700 font-medium",
                        dividerLine: "bg-gray-200",
                        dividerText: "text-gray-500",
                        footer: "hidden",
                        identityPreviewText: "text-gray-600",
                        identityPreviewEditButton: "text-brand-purple hover:text-brand-lightPurple"
                      },
                      layout: {
                        socialButtonsPlacement: "top"
                      }
                    }}
                  />
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAdminLogin(true)}
                    className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
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
