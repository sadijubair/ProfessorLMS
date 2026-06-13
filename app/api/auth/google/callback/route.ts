import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { generateStudentId } from '@/lib/auth/auth';
import { createSessionPayload, signSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';
import type { Database } from '@/lib/db/types';
import { registerDevice } from '@/services/auth.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type UserInsert = Database['public']['Tables']['users']['Insert'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
    .split(',')[0]
    .trim();
}

function getDeviceInfo(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  const agent = ua.toLowerCase();
  const deviceType = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(
    agent
  )
    ? 'mobile'
    : /ipad|tablet/i.test(agent)
      ? 'tablet'
      : 'desktop';

  const browser = /edg/i.test(ua)
    ? 'Edge'
    : /chrome/i.test(ua)
      ? 'Chrome'
      : /safari/i.test(ua)
        ? 'Safari'
        : /firefox/i.test(ua)
          ? 'Firefox'
          : 'Unknown';

  const os = /windows/i.test(ua)
    ? 'Windows'
    : /mac/i.test(ua)
      ? 'macOS'
      : /iphone|ipad|ipod/i.test(ua)
        ? 'iOS'
        : /android/i.test(ua)
          ? 'Android'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'Unknown';

  return {
    deviceName: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} - Google`,
    deviceType,
    browser,
    os,
    ipAddress: getClientIp(request),
  } as const;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/dashboard';
  const redirectPath = next.startsWith('/') ? next : '/dashboard';
  const cookieWrites: Record<string, string | null> = {};

  if (!code) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'missing_google_code');
    return NextResponse.redirect(url);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      flowType: 'pkce',
      storage: {
        getItem: (key) => request.cookies.get(key)?.value || null,
        setItem: (key, value) => {
          cookieWrites[key] = value;
        },
        removeItem: (key) => {
          cookieWrites[key] = null;
        },
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'google_oauth_callback_failed');
    return NextResponse.redirect(url);
  }

  const email = data.user.email?.trim().toLowerCase();

  if (!email) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'google_email_missing');
    return NextResponse.redirect(url);
  }

  const fullName =
    data.user.user_metadata.full_name ||
    data.user.user_metadata.name ||
    email.split('@')[0];

  const { data: existingUser, error: lookupError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (lookupError) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'profile_lookup_failed');
    return NextResponse.redirect(url);
  }

  const user =
    existingUser ||
    (
      await supabaseAdmin
        .from('users')
        .insert([
          {
            email,
            full_name: fullName,
            role: 'student',
            student_id: await generateStudentId(),
            password_hash: null,
            is_active: true,
            email_verified_at: new Date().toISOString(),
            profile_image_url: data.user.user_metadata.avatar_url || null,
          },
        ] as unknown as UserInsert[])
        .select()
        .single()
    ).data;

  if (!user) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'profile_create_failed');
    return NextResponse.redirect(url);
  }

  if (user.role !== 'student') {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'use_admin_portal');
    return NextResponse.redirect(url);
  }

  if (!user.is_active) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'account_disabled');
    return NextResponse.redirect(url);
  }

  const deviceRegResult = await registerDevice(user.id, getDeviceInfo(request));

  if (!deviceRegResult.success) {
    const url = new URL('/login', origin);
    url.searchParams.set('error', 'device_limit');
    return NextResponse.redirect(url);
  }

  await supabaseAdmin
    .from('users')
    .update({
      last_login_at: new Date().toISOString(),
      email_verified_at: user.email_verified_at || new Date().toISOString(),
      profile_image_url:
        user.profile_image_url || data.user.user_metadata.avatar_url || null,
    })
    .eq('id', user.id);

  await supabaseAdmin.from('audit_logs').insert({
    user_id: user.id,
    action: 'google_login',
    entity_type: 'users',
    entity_id: user.id,
    old_values: null,
    new_values: { device_id: deviceRegResult.data?.id || null },
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent') || null,
  } satisfies AuditLogInsert);

  const sessionToken = await signSession(
    createSessionPayload({
      userId: user.id,
      studentId: user.student_id,
      role: user.role,
      portal: 'student',
    })
  );

  const response = NextResponse.redirect(new URL(redirectPath, origin));

  for (const [key, value] of Object.entries(cookieWrites)) {
    if (value === null) {
      response.cookies.delete(key);
      continue;
    }

    response.cookies.set(key, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });
  }

  response.cookies.set('sb-session-token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return response;
}
