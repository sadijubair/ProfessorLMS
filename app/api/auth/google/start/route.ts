import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get('next') || '/dashboard';
  const callbackUrl = new URL('/api/auth/google-callback', origin);
  const cookieWrites: Record<string, string> = {};

  callbackUrl.searchParams.set(
    'next',
    next.startsWith('/') ? next : '/dashboard'
  );

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      flowType: 'pkce',
      storage: {
        getItem: () => null,
        setItem: (key, value) => {
          cookieWrites[key] = value;
        },
        removeItem: (key) => {
          delete cookieWrites[key];
        },
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: 'openid email profile',
    },
  });

  if (error || !data.url) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'google_oauth_start_failed');
    return NextResponse.redirect(url);
  }

  const response = NextResponse.redirect(data.url);

  for (const [key, value] of Object.entries(cookieWrites)) {
    response.cookies.set(key, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    });
  }

  return response;
}
