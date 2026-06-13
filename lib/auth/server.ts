import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { supabaseAdmin } from '@/lib/db/supabase';
import { verifySession, type SessionPayload } from '@/lib/auth/session';
import type { UserRole } from '@/lib/auth/rbac';
import type { Database } from '@/lib/db/types';

type UserRow = Database['public']['Tables']['users']['Row'];

const ADMIN_ROLES = new Set<UserRole>([
  'admin',
  'teacher',
  'support',
  'super_admin',
]);

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get('sb-session-token')?.value);
}

export async function getCurrentProfile() {
  const session = await getSessionFromCookies();

  if (!session) {
    return { session: null, user: null };
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', session.userId)
    .maybeSingle();

  if (error || !user || !user.is_active) {
    return { session: null, user: null };
  }

  return { session, user };
}

export async function requireSession(portal?: SessionPayload['portal']) {
  const { session, user } = await getCurrentProfile();

  if (!session || !user || (portal && session.portal !== portal)) {
    throw new Error('Unauthorized');
  }

  return { session, user };
}

export async function requireStudent() {
  const { session, user } = await requireSession('student');

  if (session.role !== 'student' || user.role !== 'student') {
    throw new Error('Student account required');
  }

  return { session, user };
}

export async function requireAdminRole(allowedRoles: UserRole[] = [...ADMIN_ROLES]) {
  const { session, user } = await requireSession('admin');

  if (!allowedRoles.includes(session.role) || !allowedRoles.includes(user.role)) {
    throw new Error('Admin account required');
  }

  return { session, user };
}

export async function requireStudentPage() {
  const profile = await getCurrentProfile();

  if (
    !profile.session ||
    !profile.user ||
    profile.session.portal !== 'student' ||
    profile.session.role !== 'student'
  ) {
    redirect('/login');
  }

  return profile as { session: SessionPayload; user: UserRow };
}

export async function requireAdminPage(allowedRoles: UserRole[] = [...ADMIN_ROLES]) {
  const profile = await getCurrentProfile();

  if (
    !profile.session ||
    !profile.user ||
    profile.session.portal !== 'admin' ||
    !allowedRoles.includes(profile.session.role) ||
    !allowedRoles.includes(profile.user.role)
  ) {
    redirect('/admin/login');
  }

  return profile as { session: SessionPayload; user: UserRow };
}
