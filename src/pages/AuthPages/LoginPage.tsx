
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth as useClerkAuth } from '@/contexts/ClerkAuthContext';
import { useAuth as useManualAuth } from '@/contexts/AuthContext';
import { SignIn } from "@clerk/clerk-react";
import LoginForm from '@/components/Auth/LoginForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LoginPage: React.FC = () => {
  const clerkAuth = useClerkAuth();
  const manualAuth = useManualAuth();
  const [activeTab, setActiveTab] = useState('clerk');
  
  // Only redirect if already authenticated - no useEffect needed
  if (clerkAuth.user || manualAuth.isAuthenticated) {
    const isAdmin = clerkAuth.isAdmin() || manualAuth.isAdmin();
    
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
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
            
            <Card>
              <CardHeader>
                <CardTitle>Choose Sign In Method</CardTitle>
                <CardDescription>
                  Sign in with Google using Clerk or use manual login
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="clerk">Google / Clerk</TabsTrigger>
                    <TabsTrigger value="manual">Manual Login</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="clerk" className="mt-6">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 text-center">
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
                  </TabsContent>
                  
                  <TabsContent value="manual" className="mt-6">
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 text-center">
                        Sign in with your email and password
                      </p>
                      <LoginForm />
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

export default LoginPage;
