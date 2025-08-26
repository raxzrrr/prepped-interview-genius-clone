
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Create Account
            </h1>
            <p className="text-muted-foreground text-lg">
              Join Interview Genius to start practicing for interviews
            </p>
          </div>
          
          <Card className="bg-gradient-card border-0 shadow-2xl backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold text-card-foreground">
                Sign Up for Interview Genius
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Create your account to start your journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <SignUp 
                  signInUrl="/login"
                  afterSignUpUrl="/dashboard"
                  appearance={{
                    elements: {
                      rootBox: "mx-auto w-full",
                      card: "shadow-none border-0 bg-transparent p-0",
                      headerTitle: "text-xl font-semibold text-card-foreground mb-2",
                      headerSubtitle: "text-muted-foreground text-sm mb-6",
                      socialButtonsBlockButton: "w-full bg-background/50 hover:bg-background/70 border border-border rounded-lg px-4 py-3 text-foreground font-medium transition-all duration-200 hover:shadow-md",
                      socialButtonsBlockButtonText: "text-foreground font-medium",
                      dividerLine: "bg-border",
                      dividerText: "text-muted-foreground text-sm",
                      formButtonPrimary: "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:shadow-md",
                      footerAction: "text-primary hover:text-primary/80 font-medium",
                      footerActionLink: "text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline",
                      formField: "mb-4",
                      formFieldInput: "w-full px-4 py-3 bg-background/50 border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200",
                      formFieldLabel: "text-foreground font-medium mb-2 block",
                      identityPreviewText: "text-foreground",
                      identityPreviewEditButton: "text-primary hover:text-primary/80",
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
