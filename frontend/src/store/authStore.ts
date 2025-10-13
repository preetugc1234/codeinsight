import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithGithub: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        set({ session, user: session.user });

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({ profile });
        }
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        set({ session, user: session?.user ?? null });

        if (session?.user) {
          // Fetch profile on auth change
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            set({ profile });
          }
        } else {
          set({ profile: null });
        }
      });

      set({ initialized: true, loading: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false, initialized: true });
    }
  },

  signUp: async (email, password, firstName, lastName) => {
    try {
      set({ loading: true });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create profile in profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            plan: 'lite',
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      set({ loading: false });
      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error: error as Error };
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      set({ loading: false });
      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error: error as Error };
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ loading: true });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      set({ loading: false });
      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error: error as Error };
    }
  },

  signInWithGithub: async () => {
    try {
      set({ loading: true });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      set({ loading: false });
      return { error: null };
    } catch (error) {
      set({ loading: false });
      return { error: error as Error };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ user: null, session: null, profile: null, loading: false });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ loading: false });
    }
  },
}));
