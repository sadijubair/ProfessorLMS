import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

// Roles that exist in the DB enum
const VALID_ROLES = ['admin', 'super_admin', 'teacher', 'mentor', 'support', 'student'] as const;
type UserRole = (typeof VALID_ROLES)[number];

export async function POST(request: Request) {
  // Auth check — don't use requireAdminPage (it calls redirect() which throws in Route Handlers)
  const { session, user } = await getCurrentProfile();
  if (
    !session ||
    !user ||
    session.portal !== 'admin' ||
    !['admin', 'super_admin'].includes(user.role)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { fullName?: string; email?: string; mobile?: string; password?: string; role?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { fullName, email, mobile, password, role } = body;

  if (!fullName?.trim())  return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
  if (!email?.trim())     return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  if (!password || password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  if (!role || !VALID_ROLES.includes(role as UserRole))
    return NextResponse.json({ error: `Invalid role "${role}". Valid roles: ${VALID_ROLES.join(', ')}` }, { status: 400 });

  // Create the auth user (bypasses email confirmation)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName.trim(),
      role,
    },
  });

  if (authError) {
    console.error('[create-user] Auth error:', authError.message);
    const msg = authError.message.toLowerCase().includes('already registered') ||
                authError.message.toLowerCase().includes('already been registered')
      ? 'A user with this email already exists.'
      : authError.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;

  // Upsert into public.users (safe fallback in case trigger hasn't fired)
  // Cast to `any` because Supabase's Insert type omits `id`, but upsert needs it for conflict resolution
  const { error: dbError } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        id: userId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile?.trim() || null,
        role: role as UserRole,
        is_active: true,
        created_at: new Date().toISOString(),
      } as any,
      { onConflict: 'id' }
    );

  if (dbError) {
    console.error('[create-user] DB upsert failed:', dbError.message);
    // Auth user was created — surface the error so admin knows
    return NextResponse.json(
      { error: `Auth account created but profile save failed: ${dbError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, userId }, { status: 201 });
}
