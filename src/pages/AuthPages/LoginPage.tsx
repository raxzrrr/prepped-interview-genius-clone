
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
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
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
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-lg">
              Sign in to your account to continue
            </p>
          </div>
          
          <Card className="bg-gradient-card border-0 shadow-2xl backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold text-card-foreground">
                Sign In to Interview Genius
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Welcome back! Please sign in to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <SignIn 
                  signUpUrl="/register"
                  afterSignInUrl="/dashboard"
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
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">Or</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => setShowAdminLogin(true)}
                className="w-full bg-background/30 hover:bg-background/50 border-border text-foreground font-medium py-3 transition-all duration-200 hover:shadow-md"
              >
                Admin Access
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
