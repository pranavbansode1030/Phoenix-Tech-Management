/**
 * Phoenix Tech Solutions - Supabase Client & Authentication Helper
 *
 * Provides typed access to Supabase client and convenience functions
 * for user login, profile fetching, and role authorization.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Phoenix Tech Solutions: Missing Supabase credentials in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface UserSessionProfile {
  id: string;
  member_code: 'PB-01' | 'AS-02' | 'VG-03' | string;
  email: string;
  full_name: string;
  role: 'founder_director' | 'co_founder' | 'technical';
  designation: string;
  avatar_url?: string;
  is_founder: boolean;
  team_member_id: string;
  monthly_compensation: number;
  responsibilities: string[];
  permissions: {
    can_approve_expenses: boolean;
    can_manage_reserves: boolean;
    can_view_drawings: boolean;
    can_assign_tasks: boolean;
    can_submit_expenses: boolean;
    can_view_projects: boolean;
    can_view_income: boolean;
  };
}

/**
 * Sign in using email and password.
 * After sign-in, loads the user's operational profile and permissions via get_current_user_profile() RPC.
 */
export async function loginWithEmail(email: string, password: string): Promise<{
  session: any;
  profile: UserSessionProfile | null;
  error: any;
}> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { session: null, profile: null, error: authError };
    }

    // Call custom Supabase RPC to load full profile + permissions
    const { data: profileData, error: profileError } = await supabase.rpc('get_current_user_profile');

    if (profileError) {
      console.warn('Could not load user profile RPC, falling back to profiles table:', profileError);
      const { data: fallbackProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return { session: authData.session, profile: fallbackProfile as any, error: null };
    }

    return { session: authData.session, profile: profileData as UserSessionProfile, error: null };
  } catch (err) {
    return { session: null, profile: null, error: err };
  }
}

/**
 * Sign out of the Supabase session
 */
export async function logoutUser(): Promise<{ error: any }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current active user profile and permissions
 */
export async function getCurrentUserProfile(): Promise<UserSessionProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc('get_current_user_profile');
  if (error || !data) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return fallback as any;
  }

  return data as UserSessionProfile;
}

