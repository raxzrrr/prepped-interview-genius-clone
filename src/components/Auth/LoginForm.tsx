
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { LoaderCircle } from "lucide-react";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  // Admin login helper
  const handleAdminLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setEmail('admin@interview.ai');
    setPassword('CurrentTempPass');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a
                href="/forgot-password"
                className="text-sm font-medium text-brand-purple hover:underline"
              >
                Forgot Password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAdminLogin}
              size="sm" 
              className="w-full text-xs text-gray-600"
            >
              Use Admin Credentials
            </Button>
            <p className="text-xs text-gray-500 text-center mt-1">
              (admin@interview.ai / CurrentTempPass)
            </p>
          </div>
        </div>
        <div className="flex flex-col space-y-2 mt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : 'Login'}
          </Button>
          <p className="text-sm text-center text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-medium text-brand-purple hover:underline"
            >
              Register here
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
