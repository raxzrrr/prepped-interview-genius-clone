
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

type UserRole = 'student' | 'admin' | null;

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  role: UserRole;
  auth_provider: string;
} | null;

interface SimpleAuthContextType {
  user: any;
  profile: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const storedSession = localStorage.getItem('manual_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        setUser(sessionData.user);
        setProfile(sessionData.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem('manual_session');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        user_email: email,
        user_password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'Invalid credentials' };
      }

      const authResult = data[0] as {
        user_id: string;
        user_data: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          auth_provider: string;
        };
      };

      const userData = authResult.user_data;
      const sessionData = {
        user: userData,
        access_token: 'manual_session_token',
        id: authResult.user_id
      };

      // Store session
      localStorage.setItem('manual_session', JSON.stringify(sessionData));
      
      // Set state
      setUser(userData);
      setProfile(userData);
      setIsAuthenticated(true);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      return { success: true };

    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || "Invalid email or password" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('register_manual_user', {
        user_email: email,
        user_password: password,
        user_full_name: name,
        user_role: role || 'student'
      });

      if (error) {
        return { success: false, error: error.message };
      }

      toast({
        title: "Registration Successful",
        description: "Account created successfully! Please log in.",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || "Failed to create account" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('manual_session');
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isStudent = () => profile?.role === 'student';

  return (
    <SimpleAuthContext.Provider value={{ 
      user,
      profile,
      loading, 
      isAuthenticated,
      isAdmin,
      isStudent,
      login,
      register,
      logout
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};
