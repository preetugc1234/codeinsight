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
            // Check if user has a profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();

            // If no profile exists, create one (for OAuth users)
            if (profileError || !profile) {
              const { error: insertError } = await supabase
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

              if (insertError) {
                console.error('Profile creation error:', insertError);
              }
            }

            // Redirect to dashboard
            router.push('/dashboard');
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
