
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignIn } from "@clerk/clerk-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const LoginPage: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });
  
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminCredentials.username === 'admin' && adminCredentials.password === 'admin') {
      // Set temporary admin access
      localStorage.setItem('tempAdmin', 'true');
      
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the admin dashboard!",
      });
      
      navigate('/admin');
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid admin credentials",
        variant: "destructive",
      });
    }
  };
  
  return (
    <MainLayout>
      <div className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
            <p className="text-gray-600 mb-8 text-center">
              Welcome back! Sign in to your account to continue your interview preparation
            </p>
            
            {!showAdminLogin ? (
              <>
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
                
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdminLogin(true)}
                    className="w-full"
                  >
                    Admin Login
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Login</CardTitle>
                  <CardDescription>
                    Enter admin credentials to access the admin dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter username"
                        value={adminCredentials.username}
                        onChange={(e) => setAdminCredentials(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={adminCredentials.password}
                        onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                      <strong>Admin Credentials:</strong><br />
                      Username: admin<br />
                      Password: admin
                    </div>
                    <Button type="submit" className="w-full">
                      Login as Admin
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdminLogin(false)}
                      className="w-full"
                    >
                      Back to Regular Login
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
