
export type UserRole = 'student' | 'admin' | null;

export type UserProfile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
} | null;

export interface AuthContextType {
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
