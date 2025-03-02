'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthFormType, AuthFormData } from '@/types/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function Auth() {
  const [formType, setFormType] = useState<AuthFormType>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
          },
          emailRedirectTo: undefined, // This disables email verification
        },
      });

      if (error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        toast.success('Sign up successful!');
        setFormType('signin');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        setError(error.message);
        toast.error(error.message);
      } else {
        toast.success('Sign in successful!');
        // Redirect to home page after successful sign-in
        router.push('/');
      }
    }

    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setError(error.message);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {formType === 'signin' ? 'Sign In' : 'Sign Up'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {formType === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              name="username"
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          {loading
            ? 'Loading...'
            : formType === 'signin'
            ? 'Sign In'
            : 'Sign Up'}
        </button>
      </form>

      <button
        onClick={handleGoogleSignIn}
        className="w-full mt-4 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
      >
        Continue with Google
      </button>

      <p className="mt-4 text-center">
        {formType === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <button
              onClick={() => setFormType('signup')}
              className="text-blue-600 hover:underline"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setFormType('signin')}
              className="text-blue-600 hover:underline"
            >
              Sign In
            </button>
          </>
        )}
      </p>
    </div>
  );
}
