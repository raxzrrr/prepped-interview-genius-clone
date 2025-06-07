
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { generateConsistentUUID } from '@/utils/userUtils';

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
  logout: () => Promise<void>;
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
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoaded) return;

    if (userId && clerkUser) {
      console.log('Setting up user profile for:', userId);
      
      // User is authenticated
      const userEmail = clerkUser.primaryEmailAddress?.emailAddress || '';
      const userName = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || userEmail.split('@')[0];
      
      // Set role based on email for now (this would be replaced by proper role management)
      const role: UserRole = userEmail === 'admin@interview.ai' ? 'admin' : 'student';
      
      setProfile({
        id: userId,
        full_name: userName,
        avatar_url: clerkUser.imageUrl,
        role: role
      });

      // Sync with supabase for data consistency if needed
      syncUserWithSupabase(userId, userName, role);
    } else {
      console.log('No user found, clearing profile');
      setProfile(null);
    }
    
    setLoading(false);
  }, [isLoaded, userId, clerkUser]);

  const syncUserWithSupabase = async (userId: string, fullName: string, role: UserRole) => {
    try {
      console.log('Syncing user with Supabase:', userId);
      
      // Convert Clerk user ID to consistent UUID for Supabase
      const supabaseUserId = generateConsistentUUID(userId);
      
      // Check if the user exists in the profiles table
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUserId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        console.log('Creating new profile for user');
        // Create a new profile if doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUserId,
            full_name: fullName,
            role: role
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully');
        }
      } else {
        console.log('Profile already exists');
      }
    } catch (error) {
      console.error('Error syncing user with Supabase:', error);
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isStudent = () => profile?.role === 'student';
  
  const logout = async () => {
    console.log("Logout function called");
    try {
      await clerk.signOut();
      setProfile(null);
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

  return (
    <AuthContext.Provider value={{ 
      user: clerkUser,
      session: { id: sessionId },
      profile,
      loading, 
      isAdmin,
      isStudent,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
