
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignUp } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RegisterPage: React.FC = () => {
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
      <div className="py-16 bg-gradient-to-b from-gray-50 to-white min-h-screen flex items-center justify-center">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600">
                Start your interview preparation journey today
              </p>
            </div>
            
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl font-bold text-gray-900">Sign Up</CardTitle>
                <CardDescription className="text-gray-600">
                  Create your account to access all features
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="clerk-signup-wrapper">
                  <SignUp 
                    signInUrl="/login"
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
