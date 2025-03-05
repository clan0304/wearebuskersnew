import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth?error=auth_failed`
      );
    }

    // IMPORTANT: Always redirect Google OAuth users to the username prompt
    // This is the key change - we don't try to check the profile first
    if (data.session?.user.app_metadata.provider === 'google') {
      console.log('Google OAuth user - redirecting to username prompt');

      // Create the redirect URL with the required parameters
      const redirectUrl = new URL(`${requestUrl.origin}/auth`);
      redirectUrl.searchParams.set('prompt', 'username');
      redirectUrl.searchParams.set('provider', 'google');

      // Force the redirect - no conditions or checks
      return NextResponse.redirect(redirectUrl.toString());
    }
  }

  // Default fallback - redirect to homepage
  return NextResponse.redirect(requestUrl.origin);
}
