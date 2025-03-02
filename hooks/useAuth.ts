// hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      setIsLoading(true);

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setSession(session);
      setIsSignedIn(!!session?.user);

      setIsLoading(false);

      // Set up listener for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user || null);
          setSession(session);
          setIsSignedIn(!!session?.user);
        }
      );

      // Clean up subscription
      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initAuth();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    isSignedIn,
    isLoading,
    signOut,
  };
}
