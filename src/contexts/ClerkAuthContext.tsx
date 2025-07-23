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
  const { isLoaded, userId } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
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
      return null;
    }
    return generateConsistentUUID(userId);
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('Initializing auth - isLoaded:', isLoaded, 'userId:', userId, 'isTempAdmin:', isTempAdmin);
      
      if (isTempAdmin) {
        if (mounted) {
          setProfile({
            id: 'temp-admin-id',
            full_name: 'Admin User',
            email: 'admin@interview.ai',
            role: 'admin'
          });
          setIsAuthenticated(true);
          setLoading(false);
        }
        return;
      }

      if (!isLoaded) {
        return; // Wait for Clerk to load
      }

      if (!userId || !clerkUser) {
        if (mounted) {
          setProfile(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
        return;
      }

      try {
        const supabaseUserId = generateConsistentUUID(userId);
        const userEmail = clerkUser.primaryEmailAddress?.emailAddress;
        
        if (!userEmail) {
          console.error('No email found for user');
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('Setting up profile for user:', { userId, supabaseUserId, userEmail });

        // Check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUserId)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error checking profile:', profileError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        let profileData = existingProfile;

        if (!existingProfile) {
          console.log('Creating new profile');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: supabaseUserId,
              email: userEmail,
              full_name: clerkUser.fullName || clerkUser.firstName || 'User',
              role: 'student',
              auth_provider: 'clerk'
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            if (mounted) {
              setLoading(false);
            }
            return;
          }
          profileData = newProfile;
        }

        if (mounted) {
          setProfile(profileData);
          setIsAuthenticated(true);
          setLoading(false);
        }
        
      } catch (error) {
        console.error('Error in auth initialization:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [isLoaded, userId, clerkUser, isTempAdmin]);

  const isAdmin = () => profile?.role === 'admin';
  const isStudent = () => profile?.role === 'student';

  const logout = async () => {
    try {
      localStorage.removeItem('tempAdmin');
      if (clerk && !isTempAdmin) {
        await clerk.signOut();
      }
      setProfile(null);
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

  // Create a simple session object for compatibility
  const sessionObject = isAuthenticated ? {
    id: userId || 'temp-admin-session',
    user: {
      id: getSupabaseUserId(),
      email: isTempAdmin ? 'admin@interview.ai' : clerkUser?.primaryEmailAddress?.emailAddress
    },
    isActive: true
  } : null;

  console.log('Auth state:', {
    isLoaded,
    userId,
    isAuthenticated,
    hasProfile: !!profile,
    profileRole: profile?.role,
    isTempAdmin
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