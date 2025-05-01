
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

type UserRole = 'student' | 'admin' | null;

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
} | null;

interface AuthContextType {
  user: any;
  session: any;
  profile: UserProfile;
  loading: boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, userId, sessionId } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      // User is authenticated
      const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || '';
      const userName = clerkUser?.firstName && clerkUser?.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : userEmail.split('@')[0];
      
      // Set role based on email for now (this would be replaced by proper role management)
      const role: UserRole = userEmail === 'admin@interview.ai' ? 'admin' : 'student';
      
      setProfile({
        id: userId,
        full_name: userName,
        avatar_url: clerkUser?.imageUrl,
        role: role
      });

      // Sync with supabase for data consistency if needed
      syncUserWithSupabase(userId, userName, role);
    } else {
      setProfile(null);
    }
    
    setLoading(false);
  }, [isLoaded, userId, clerkUser]);

  const syncUserWithSupabase = async (userId: string, fullName: string, role: UserRole) => {
    try {
      // Check if the user exists in the profiles table
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // Create a new profile if doesn't exist
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
            role: role
          });
      }
    } catch (error) {
      console.error('Error syncing user with Supabase:', error);
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isStudent = () => profile?.role === 'student';

  return (
    <AuthContext.Provider value={{ 
      user: clerkUser,
      session: { id: sessionId },
      profile,
      loading, 
      isAdmin,
      isStudent
    }}>
      {children}
    </AuthContext.Provider>
  );
};
