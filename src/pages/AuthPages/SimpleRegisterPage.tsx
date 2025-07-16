
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { SignUp } from "@clerk/clerk-react";
import SimpleRegisterForm from '@/components/Auth/SimpleRegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SimpleRegisterPage: React.FC = () => {
  const { isAuthenticated, isAdmin, loading } = useSimpleAuth();
  const [registerMethod, setRegisterMethod] = useState<'manual' | 'clerk'>('manual');

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-t-brand-purple border-r-transparent border-b-brand-purple border-l-transparent animate-spin"></div>
        <span className="ml-3 text-gray-700">Loading...</span>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={isAdmin() ? "/admin" : "/dashboard"} replace />;
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
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Choose your preferred registration method
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registerMethod === 'manual' ? (
                  <div className="space-y-4">
                    <SimpleRegisterForm />
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setRegisterMethod('clerk')}
                        className="w-full text-sm"
                      >
                        Sign up with Google instead
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                    <div className="pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setRegisterMethod('manual')}
                        className="w-full text-sm"
                      >
                        Use manual registration instead
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SimpleRegisterPage;
