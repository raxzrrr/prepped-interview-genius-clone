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
  email?: string;
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

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';

  // Function to get consistent Supabase user ID
  const getSupabaseUserId = () => {
    if (isTempAdmin) {
      return 'temp-admin-id';
    }
    if (!userId) {
      console.log('getSupabaseUserId: No userId available');
      return null;
    }
    const supabaseId = generateConsistentUUID(userId);
    console.log('getSupabaseUserId: Generated Supabase ID:', { clerkId: userId, supabaseId });
    return supabaseId; // Return only the UUID string, not an object
  };

  // Set up Supabase session with Clerk token
  const setupSupabaseSession = async () => {
    if (isTempAdmin) {
      // For temp admin, create a mock session
      setSupabaseSession({
        user: { id: 'temp-admin-id', email: 'admin@interview.ai' },
        access_token: 'temp-admin-token'
      });
      setIsAuthenticated(true);
      return;
    }

    if (!userId || !clerkUser) {
      console.log('No user found, clearing Supabase session');
      await supabase.auth.signOut();
      setSupabaseSession(null);
      setIsAuthenticated(false);
      return;
    }

    try {
      console.log('Setting up Supabase session for user:', userId);
      
      // Get Supabase JWT token from Clerk
      const token = await getToken({ template: 'supabase' });
      
      if (token) {
        // Set the session using Clerk's Supabase token
        const { data, error } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: 'clerk-managed'
        });
        
        if (data.session) {
          console.log('Supabase session established successfully');
          setSupabaseSession(data.session);
          setIsAuthenticated(true);
        } else {
          console.error('Failed to establish Supabase session:', error);
          setIsAuthenticated(true); // Still authenticate via Clerk
        }
      } else {
        console.error('No Supabase token received from Clerk');
        setIsAuthenticated(true); // Still authenticate via Clerk
      }
    } catch (error) {
      console.error('Error setting up Supabase session:', error);
      setIsAuthenticated(true); // Still authenticate via Clerk
    }
  };

  useEffect(() => {
    if (isTempAdmin) {
      // Set up temporary admin profile
      setProfile({
        id: 'temp-admin-id',
        full_name: 'Admin User',
        avatar_url: undefined,
        email: 'admin@interview.ai',
        role: 'admin'
      });
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

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
        email: userEmail,
        role: role
      });

      // Set authenticated to true immediately when we have a Clerk user
      setIsAuthenticated(true);

      // Set up Supabase session (this can fail but shouldn't affect authentication state)
      setupSupabaseSession();

      // Sync with supabase for data consistency
      syncUserWithSupabase(userId, userName, userEmail, role);
    } else {
      console.log('No user found, clearing all state');
      setProfile(null);
      setSupabaseSession(null);
      setIsAuthenticated(false);
      supabase.auth.signOut();
    }
    
    setLoading(false);
  }, [isLoaded, userId, clerkUser, sessionId, isTempAdmin]);

  const syncUserWithSupabase = async (userId: string, fullName: string, email: string, role: UserRole) => {
    try {
      console.log('Syncing user with Supabase:', { userId, fullName, email, role });
      
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
            email: email,
            role: role
          });
          
        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully');
        }
      } else {
        // Update existing profile with email if it's missing or different
        if (!existingProfile.email || existingProfile.email !== email) {
          console.log('Updating existing profile with email');
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email: email,
              full_name: fullName
            })
            .eq('id', supabaseUserId);
            
          if (updateError) {
            console.error('Error updating profile:', updateError);
          } else {
            console.log('Profile updated successfully with email');
          }
        } else {
          console.log('Profile already exists with correct email');
        }
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
      // Clear temporary admin access
      localStorage.removeItem('tempAdmin');
      
      await supabase.auth.signOut();
      if (clerkUser) {
        await clerk.signOut();
      }
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
  const sessionObject = isAuthenticated ? {
    id: sessionId || 'temp-admin-session',
    user: {
      id: getSupabaseUserId(),
      email: isTempAdmin ? 'admin@interview.ai' : clerkUser?.primaryEmailAddress?.emailAddress
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
    supabaseUserId: getSupabaseUserId(),
    isTempAdmin,
    profileEmail: profile?.email
  });

  return (
    <AuthContext.Provider value={{ 
      user: isTempAdmin ? { primaryEmailAddress: { emailAddress: 'admin@interview.ai' } } : clerkUser,
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
