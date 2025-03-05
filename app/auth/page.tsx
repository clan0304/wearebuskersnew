'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthFormType, AuthFormData } from '@/types/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [formType, setFormType] = useState<AuthFormType>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [username, setUsername] = useState('');
  const router = useRouter();

  // Check session and redirect logic
  // Updated useEffect in Auth component
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First, check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const promptUsername = urlParams.get('prompt') === 'username';
        const provider = urlParams.get('provider');
        const authError = urlParams.get('error');

        console.log('Auth component loaded. URL parameters:', {
          promptUsername,
          provider,
          authError,
        });

        if (authError) {
          console.error('Auth error from URL:', authError);
          setError(`Authentication error: ${authError}`);
          return;
        }

        // If we have the prompt=username and provider=google parameters,
        // show the username prompt immediately
        if (promptUsername && provider === 'google') {
          console.log('Username prompt triggered by URL parameters');

          // Get current session to make sure we have a user
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData.session) {
            console.log('Session found, showing username prompt');
            setShowUsernamePrompt(true);
            return;
          } else {
            console.log('No session found despite prompt parameters');
            // If somehow we got here without a session, redirect to sign in
            setFormType('signin');
            return;
          }
        }

        // Normal session check - only redirect if we're not handling a username prompt
        const { data: sessionData } = await supabase.auth.getSession();

        if (sessionData.session && !promptUsername) {
          console.log('User is logged in, redirecting to home');
          router.push('/');
        }
      } catch (err) {
        console.error('Error in checkSession:', err);
      }
    };

    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: AuthFormData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    if (formType === 'signup') {
      data.username = formData.get('username') as string;

      if (!data.username || data.username.trim() === '') {
        setError('Username is required');
        setLoading(false);
        return;
      }

      const { data: existingProfiles, error: profileCheckError } =
        await supabase
          .from('profiles')
          .select('username')
          .eq('username', data.username)
          .maybeSingle();

      if (profileCheckError) {
        setError(profileCheckError.message);
        toast.error(profileCheckError.message);
        setLoading(false);
        return;
      }

      if (existingProfiles) {
        setError('Username already taken. Please choose another one.');
        toast.error('Username already taken');
        setLoading(false);
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: data.email,
          password: data.password,
          options: {
            data: { username: data.username },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        }
      );

      if (signUpError) {
        setError(signUpError.message);
        toast.error(signUpError.message);
      } else {
        toast.success('Check your email to confirm your account!');
        if (authData?.user) {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            username: data.username,
            updated_at: new Date().toISOString(),
          });
        }
        setFormType('signin');
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError(signInError.message);
        toast.error(signInError.message);
      } else {
        toast.success('Sign in successful!');
        router.push('/');
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      // IMPORTANT: We're setting a custom redirectUrl that includes our custom parameters
      // This will make the OAuth flow directly return to our custom URL
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Change this to include our custom parameters directly
          redirectTo: `${window.location.origin}/auth/callback?next=/auth%3Fprompt%3Dusername%26provider%3Dgoogle`,
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        setError(error.message);
        toast.error(error.message);
      }
    } catch (err) {
      console.error('Unexpected error in OAuth flow:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };
  const handleUsernameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    try {
      // Check if username is already taken
      const { data: existingProfiles, error: profileCheckError } =
        await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .neq('id', (await supabase.auth.getUser()).data.user?.id) // Exclude current user
          .maybeSingle();

      if (profileCheckError) {
        console.error('Error checking username:', profileCheckError);
        setError(profileCheckError.message);
        toast.error(profileCheckError.message);
        setLoading(false);
        return;
      }

      if (existingProfiles) {
        setError('Username already taken. Please choose another one.');
        toast.error('Username already taken');
        setLoading(false);
        return;
      }

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userData.user) {
        console.error('Error getting user:', userError);
        setError('User not found. Please sign in again.');
        toast.error('Authentication error');
        setLoading(false);
        return;
      }

      console.log('Current user:', userData.user);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { username },
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        setError(updateError.message);
        toast.error(updateError.message);
        setLoading(false);
        return;
      }

      // Update profile - try insert first, then update if it exists
      const { error: upsertError } = await supabase.from('profiles').upsert(
        {
          id: userData.user.id,
          username: username,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (upsertError) {
        console.error('Error updating profile:', upsertError);
        setError(upsertError.message);
        toast.error(upsertError.message);
        setLoading(false);

        // If upsert fails, try explicit update as fallback
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            username: username,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userData.user.id);

        if (updateProfileError) {
          console.error(
            'Error in fallback profile update:',
            updateProfileError
          );
          setLoading(false);
          return;
        }
      }

      console.log('Profile updated successfully');
      toast.success('Profile setup complete!');
      router.push('/');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
      toast.error('Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (showUsernamePrompt) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg min-h-[80vh] flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          One Last Step!
        </h2>
        <p className="mb-6 text-gray-600">
          Thanks for signing in with Google! Please choose a username to
          complete your profile.
        </p>
        <form onSubmit={handleUsernameSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Choose a Username
            </label>
            <input
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your desired username"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Username must be unique. Letters, numbers, and underscores only.
            </p>
          </div>

          {error && (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating your profile...' : 'Complete Sign Up'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg min-h-[80vh] flex flex-col justify-center">
      <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
        {formType === 'signin' ? 'Welcome Back' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {formType === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Choose a username"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed mt-6"
        >
          {loading
            ? 'Processing...'
            : formType === 'signin'
            ? 'Sign In'
            : 'Create Account'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition duration-200 shadow-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </button>

      <p className="mt-8 text-center text-gray-600">
        {formType === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setFormType('signup')}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setFormType('signin')}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign In
            </button>
          </>
        )}
      </p>
    </div>
  );
}
