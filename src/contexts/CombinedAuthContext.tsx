
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useAuth as useManualAuth } from '@/contexts/AuthContext';

type UserRole = 'student' | 'admin' | null;

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  role: UserRole;
  auth_provider: string;
} | null;

interface CombinedAuthContextType {
  user: any;
  session: any;
  profile: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  getSupabaseUserId: () => string | null;
}

const CombinedAuthContext = createContext<CombinedAuthContextType | undefined>(undefined);

export const useCombinedAuth = () => {
  const context = useContext(CombinedAuthContext);
  if (context === undefined) {
    throw new Error('useCombinedAuth must be used within a CombinedAuthProvider');
  }
  return context;
};

export const CombinedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clerkAuth = useClerkAuth();
  const { user: clerkUser } = useUser();
  const manualAuth = useManualAuth();
  
  // Determine which auth system is active
  const isClerkActive = clerkAuth.isLoaded && clerkAuth.userId;
  const isManualActive = manualAuth.isAuthenticated;
  
  // Use the appropriate auth context
  const activeAuth = isClerkActive ? {
    user: clerkUser,
    session: clerkAuth.sessionId ? { id: clerkAuth.sessionId, user: clerkUser } : null,
    profile: null, // You'd need to fetch this from Supabase for Clerk users
    loading: !clerkAuth.isLoaded,
    isAuthenticated: !!clerkAuth.userId,
    isAdmin: () => false, // Implement based on your logic
    isStudent: () => true, // Implement based on your logic
    login: async () => {}, // Clerk handles this
    register: async () => {}, // Clerk handles this
    logout: async () => clerkAuth.signOut(),
    getSupabaseUserId: () => clerkAuth.userId
  } : {
    user: manualAuth.user,
    session: manualAuth.session,
    profile: manualAuth.profile,
    loading: manualAuth.loading,
    isAuthenticated: manualAuth.isAuthenticated,
    isAdmin: manualAuth.isAdmin,
    isStudent: manualAuth.isStudent,
    login: manualAuth.login,
    register: manualAuth.register,
    logout: manualAuth.logout,
    getSupabaseUserId: () => manualAuth.user?.id || null
  };

  return (
    <CombinedAuthContext.Provider value={activeAuth}>
      {children}
    </CombinedAuthContext.Provider>
  );
};
