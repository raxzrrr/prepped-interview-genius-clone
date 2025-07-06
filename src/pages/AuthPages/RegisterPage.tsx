
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignUp } from "@clerk/clerk-react";
import ManualRegisterForm from '@/components/Auth/ManualRegisterForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>
            <p className="text-gray-600 mb-8 text-center">
              Create your Interview Genius account to start practicing for interviews
            </p>
            
            <Tabs defaultValue="clerk" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="clerk">Quick Sign Up</TabsTrigger>
                <TabsTrigger value="manual">Manual Registration</TabsTrigger>
              </TabsList>
              
              <TabsContent value="clerk" className="mt-6">
                <SignUp 
                  signInUrl="/login"
                  afterSignUpUrl="/dashboard"
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
                <ManualRegisterForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
