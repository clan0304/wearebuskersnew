import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pathname = usePathname();

  // Function to check if user needs to set a username
  const checkForUsernameSetup = async (user: User | null) => {
    if (!user) return false;

    // Don't redirect if we're already on the auth page with username prompt
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const isAuthPage = pathname?.includes('/auth');
      const isUsernamePrompt = url.searchParams.get('prompt') === 'username';

      if (isAuthPage && isUsernamePrompt) {
        console.log('Skipping username check - already on prompt page');
        return false;
      }
    }

    try {
      // Check if this is a Google OAuth user
      const isGoogleUser = user.app_metadata?.provider === 'google';

      if (isGoogleUser) {
        // Check if user already has a proper username in the profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();

        console.log('Profile check for OAuth user:', {
          profile,
          error,
          userEmail: user.email,
        });

        // If profile doesn't exist or username equals email, user needs to set username
        if (!profile || !profile.username || profile.username === user.email) {
          console.log('User needs to set username');
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Error checking profile:', err);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    let isFirstLoad = true;

    const initAuth = async () => {
      setIsLoading(true);

      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const currentUser = session?.user || null;
        setUser(currentUser);
        setSession(session);
        setIsSignedIn(!!currentUser);

        // Only check on first load and if user exists
        if (isFirstLoad && currentUser) {
          const needsUsername = await checkForUsernameSetup(currentUser);

          if (needsUsername && typeof window !== 'undefined') {
            console.log('Redirecting to username setup page');
            window.location.href = '/auth?prompt=username&provider=google';
            return;
          }
        }

        setIsLoading(false);
        isFirstLoad = false;

        // Set up listener for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            const updatedUser = session?.user || null;

            setUser(updatedUser);
            setSession(session);
            setIsSignedIn(!!updatedUser);

            // Only check on sign in events
            if (event === 'SIGNED_IN' && updatedUser) {
              const needsUsername = await checkForUsernameSetup(updatedUser);

              if (needsUsername && typeof window !== 'undefined') {
                console.log('Auth changed: Redirecting to username setup');
                window.location.href = '/auth?prompt=username&provider=google';
                return;
              }
            }
          }
        );

        // Clean up subscription
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error in auth initialization:', err);
        setIsLoading(false);
        isFirstLoad = false;
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Clear the check flag
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('usernameCheckPerformed');
    }
  };

  return {
    user,
    session,
    isSignedIn,
    isLoading,
    signOut,
  };
}
