
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseUserIdFromClerk, createUserProfile } from '@/utils/authUtils';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { AuthContextType, UserProfile } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, userId, sessionId, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  
  const { 
    supabaseSession, 
    setSupabaseSession, 
    setupSupabaseSession, 
    syncUserWithSupabase 
  } = useSupabaseSession();

  const getSupabaseUserId = () => getSupabaseUserIdFromClerk(userId);

  useEffect(() => {
    if (!isLoaded) {
      console.log('Clerk not loaded yet');
      return;
    }

    console.log('Clerk loaded, userId:', userId, 'clerkUser:', !!clerkUser);

    if (userId && clerkUser) {
      console.log('User authenticated, setting up profile and session');
      
      const userProfile = createUserProfile(userId, clerkUser);
      setProfile(userProfile);
      setIsAuthenticated(true);

      setupSupabaseSession(userId, clerkUser, getToken);
      syncUserWithSupabase(userId, userProfile.full_name, userProfile.role);
    } else {
      console.log('No user found, clearing all state');
      setProfile(null);
      setSupabaseSession(null);
      setIsAuthenticated(false);
      supabase.auth.signOut();
    }
    
    setLoading(false);
  }, [isLoaded, userId, clerkUser, sessionId, setupSupabaseSession, syncUserWithSupabase, setSupabaseSession]);

  const isAdmin = () => profile?.role === 'admin';
  const isStudent = () => profile?.role === 'student';
  
  const logout = async () => {
    console.log("Logout function called");
    try {
      await supabase.auth.signOut();
      await clerk.signOut();
      setProfile(null);
      setSupabaseSession(null);
      setIsAuthenticated(false);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      return Promise.resolve();
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive"
      });
      return Promise.reject(error);
    }
  };

  const sessionObject = isAuthenticated ? {
    id: sessionId,
    user: {
      id: getSupabaseUserId(),
      email: clerkUser?.primaryEmailAddress?.emailAddress
    },
    supabaseSession,
    isActive: true
  } : null;

  console.log('Auth context state:', {
    isLoaded,
    userId,
    isAuthenticated,
    hasProfile: !!profile,
    hasSession: !!sessionObject,
    supabaseUserId: getSupabaseUserId()
  });

  return (
    <AuthContext.Provider value={{ 
      user: clerkUser,
      session: sessionObject,
      profile,
      loading, 
      isAuthenticated,
      isAdmin,
      isStudent,
      logout,
      getSupabaseUserId
    }}>
      {children}
    </AuthContext.Provider>
  );
};
