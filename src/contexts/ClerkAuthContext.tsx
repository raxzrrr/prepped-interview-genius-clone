
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
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  logout: () => Promise<void>;
  getSupabaseUserId: () => string | null;
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
  const { isLoaded, userId, sessionId, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Function to get consistent Supabase user ID
  const getSupabaseUserId = () => {
    if (!userId) {
      console.log('getSupabaseUserId: No userId available');
      return null;
    }
    const supabaseId = generateConsistentUUID(userId);
    console.log('getSupabaseUserId: Generated Supabase ID:', { clerkId: userId, supabaseId });
    return supabaseId;
  };

  // Set up Supabase session with Clerk token
  const setupSupabaseSession = async () => {
    if (!userId || !clerkUser) {
      console.log('No user found, clearing Supabase session');
      await supabase.auth.signOut();
      setSupabaseSession(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      console.log('Setting up Supabase session for user:', userId);
      const token = await getToken({ template: 'supabase' });
      
      if (token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: 'placeholder'
        });
        
        if (error) {
          console.error('Supabase session error:', error);
          setIsAuthenticated(false);
        } else {
          setSupabaseSession(data.session);
          setIsAuthenticated(true);
          console.log('Supabase session established successfully');
        }
      } else {
        console.error('No Supabase token received from Clerk');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error setting up Supabase session:', error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) {
      console.log('Clerk not loaded yet');
      return;
    }

    console.log('Clerk loaded, userId:', userId, 'clerkUser:', !!clerkUser);

    if (userId && clerkUser) {
      console.log('User authenticated, setting up profile and session');
      
      // User is authenticated
      const userEmail = clerkUser.primaryEmailAddress?.emailAddress || '';
      const userName = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || userEmail.split('@')[0];
      
      // Set role based on email for now
      const role: UserRole = userEmail === 'admin@interview.ai' ? 'admin' : 'student';
      
      setProfile({
        id: userId,
        full_name: userName,
        avatar_url: clerkUser.imageUrl,
        role: role
      });

      // Set up Supabase session
      setupSupabaseSession();

      // Sync with supabase for data consistency if needed
      syncUserWithSupabase(userId, userName, role);
    } else {
      console.log('No user found, clearing all state');
      setProfile(null);
      setSupabaseSession(null);
      setIsAuthenticated(false);
      supabase.auth.signOut();
    }
    
    setLoading(false);
  }, [isLoaded, userId, clerkUser, sessionId]);

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

  // Create a session object that includes both Clerk and Supabase session details
  const sessionObject = isAuthenticated && supabaseSession ? {
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
