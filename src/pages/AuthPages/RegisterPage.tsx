
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignUp } from "@clerk/clerk-react";
import RegisterForm from '@/components/Auth/RegisterForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RegisterPage: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const [activeTab, setActiveTab] = useState('clerk');
  
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
            
            <Card>
              <CardHeader>
                <CardTitle>Choose Registration Method</CardTitle>
                <CardDescription>
                  Sign up with Google using Clerk or create a manual account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="clerk">Google / Clerk</TabsTrigger>
                    <TabsTrigger value="manual">Manual Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="clerk" className="mt-6">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 text-center">
                        Sign up with Google or create a new account using Clerk
                      </p>
                      <SignUp 
                        signInUrl="/login"
                        afterSignUpUrl="/dashboard"
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
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-6">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 text-center">
                        Create an account with email and password
                      </p>
                      <RegisterForm />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
