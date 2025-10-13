'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL params
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) throw error;

          if (data.session) {
            // Try to create profile (may fail if table doesn't exist, which is okay)
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.session.user.id)
                .single();

              // If no profile exists, try to create one (for OAuth users)
              if (profileError || !profile) {
                await supabase
                  .from('profiles')
                  .insert({
                    id: data.session.user.id,
                    email: data.session.user.email,
                    first_name: data.session.user.user_metadata?.first_name ||
                                data.session.user.user_metadata?.full_name?.split(' ')[0] ||
                                '',
                    last_name: data.session.user.user_metadata?.last_name ||
                               data.session.user.user_metadata?.full_name?.split(' ')[1] ||
                               '',
                    plan: 'lite',
                  });
              }
            } catch (profileError) {
              // Profile table doesn't exist or other error - continue anyway
              console.log('Profile creation skipped:', profileError);
            }

            // Redirect to dashboard - auth state will be handled by authStore
            router.push('/dashboard');
          }
        } else {
          // No code param, might be email/password redirect with hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');

          if (accessToken) {
            // Redirect to home page which will handle the token
            router.push('/');
          } else {
            // No code or token, redirect to login
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/login?error=auth_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
