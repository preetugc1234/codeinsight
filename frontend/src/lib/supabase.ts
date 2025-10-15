import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  plan: 'trial' | 'lite' | 'pro' | 'business';
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_status?: 'active' | 'expired' | 'cancelled';
  tokens_used_this_month?: number;
  monthly_token_limit?: number;
  billing_period_start?: string;
  billing_period_end?: string;
  created_at: string;
};
