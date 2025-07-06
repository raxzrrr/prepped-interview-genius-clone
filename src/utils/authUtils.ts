
import { generateConsistentUUID } from '@/utils/userUtils';
import type { UserRole } from '@/types/auth';

export const getSupabaseUserIdFromClerk = (userId: string | null): string | null => {
  if (!userId) {
    console.log('getSupabaseUserId: No userId available');
    return null;
  }
  const supabaseId = generateConsistentUUID(userId);
  console.log('getSupabaseUserId: Generated Supabase ID:', { clerkId: userId, supabaseId });
  return supabaseId;
};

export const determineUserRole = (userEmail: string): UserRole => {
  return userEmail === 'admin@interview.ai' ? 'admin' : 'student';
};

export const createUserProfile = (userId: string, clerkUser: any): any => {
  const userEmail = clerkUser.primaryEmailAddress?.emailAddress || '';
  const userName = clerkUser.firstName && clerkUser.lastName
    ? `${clerkUser.firstName} ${clerkUser.lastName}`
    : clerkUser.username || userEmail.split('@')[0];
  
  const role = determineUserRole(userEmail);
  
  return {
    id: userId,
    full_name: userName,
    avatar_url: clerkUser.imageUrl,
    role: role
  };
};
