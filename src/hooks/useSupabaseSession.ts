
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateConsistentUUID } from '@/utils/userUtils';
import type { UserRole } from '@/types/auth';

export const useSupabaseSession = () => {
  const [supabaseSession, setSupabaseSession] = useState<any>(null);

  const setupSupabaseSession = useCallback(async (userId: string | null, clerkUser: any, getToken: any) => {
    if (!userId || !clerkUser) {
      console.log('No user found, clearing Supabase session');
      await supabase.auth.signOut();
      setSupabaseSession(null);
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
        } else {
          setSupabaseSession(data.session);
          console.log('Supabase session established successfully');
        }
      } else {
        console.error('No Supabase token received from Clerk');
      }
    } catch (error) {
      console.error('Error setting up Supabase session:', error);
    }
  }, []);

  const syncUserWithSupabase = useCallback(async (userId: string, fullName: string, role: UserRole) => {
    try {
      console.log('Syncing user with Supabase:', userId);
      
      const supabaseUserId = generateConsistentUUID(userId);
      
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
  }, []);

  return {
    supabaseSession,
    setSupabaseSession,
    setupSupabaseSession,
    syncUserWithSupabase
  };
};
