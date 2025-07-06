
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignIn } from "@clerk/clerk-react";
import LoginForm from '@/components/Auth/LoginForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LoginPage: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
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
  
  return (
    <MainLayout>
      <div className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
            <p className="text-gray-600 mb-8 text-center">
              Welcome back! Sign in to your account to continue your interview preparation
            </p>
            
            <Tabs defaultValue="clerk" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clerk">Quick Sign In</TabsTrigger>
                <TabsTrigger value="manual">Manual Login</TabsTrigger>
              </TabsList>
              
              <TabsContent value="clerk" className="mt-6">
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
              </TabsContent>
              
              <TabsContent value="manual" className="mt-6">
                <LoginForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
