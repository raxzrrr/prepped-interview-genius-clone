
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { SignIn } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { user, isAdmin, isStudent } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAdminLogin = location.pathname.includes('admin') || location.state?.isAdmin || searchParams.get('admin') === 'true';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Redirect if already logged in
  if (user) {
    if (isAdmin()) {
      return <Navigate to="/admin" />;
    } else if (isStudent()) {
      return <Navigate to="/dashboard" />;
    }
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simple admin login validation
    if (username === 'admin' && password === 'admin') {
      // In a real app, this would be a proper authentication flow
      // For now, we'll just simulate a successful login
      setTimeout(() => {
        toast({
          title: "Admin Login Successful",
          description: "Redirecting to admin dashboard...",
        });
        
        // In a real app, this would set proper admin credentials
        window.location.href = '/admin';
      }, 1000);
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      setLoading(false);
    }
  };
  
  const handleSwitchToAdmin = () => {
    window.history.replaceState({isAdmin: true}, '', '/login?admin=true');
    window.location.reload();
  };
  
  const handleSwitchToStudent = () => {
    window.history.replaceState({}, '', '/login');
    window.location.reload();
  };
  
  return (
    <MainLayout>
      <div className="py-16 bg-gray-50">
        <div className="container px-4 mx-auto">
          <div className="max-w-md mx-auto">
            {isAdminLogin ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
                  <CardDescription>
                    Login with your administrator credentials to access the dashboard
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Admin Credentials:</strong><br />
                      Username: admin<br />
                      Password: admin
                    </AlertDescription>
                  </Alert>
                  
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Logging in...
                        </span>
                      ) : (
                        'Login as Admin'
                      )}
                    </Button>
                  </form>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    variant="ghost" 
                    onClick={handleSwitchToStudent}
                    size="sm"
                    className="w-full"
                  >
                    Switch to Student Login
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
                <p className="text-gray-600 mb-8 text-center">
                  Welcome back! Sign in to your account to continue your interview preparation
                </p>
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
                    variant="ghost" 
                    onClick={handleSwitchToAdmin}
                    size="sm"
                  >
                    Switch to Admin Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
