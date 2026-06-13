import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';
import type { UserRole } from '@/lib/auth/rbac';

const ADMIN_ROUTES = ['/admin'];
const STUDENT_ROUTES = ['/dashboard', '/exams'];
const ADMIN_PUBLIC_ROUTES = ['/admin/login'];
const ADMIN_ROLES = new Set<UserRole>([
  'admin',
  'teacher',
  'support',
  'super_admin',
]);

async function getSession(request: NextRequest) {
  return verifySession(request.cookies.get('sb-session-token')?.value);
}

function isAdminSubdomain(host: string) {
  return host.toLowerCase().startsWith('admin.');
}

function isPath(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';

  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const session = await getSession(request);
  const loggedIn = Boolean(session);
  const onAdminSubdomain = isAdminSubdomain(host);

  if (onAdminSubdomain) {
    if (pathname === '/') {
      return redirect(request, loggedIn ? '/admin/dashboard' : '/admin/login');
    }

    if (isPath(pathname, ADMIN_PUBLIC_ROUTES)) {
      return NextResponse.next();
    }

    if (!isPath(pathname, ADMIN_ROUTES)) {
      return redirect(request, loggedIn ? '/admin/dashboard' : '/admin/login');
    }

    if (!loggedIn) {
      return redirect(request, '/admin/login');
    }

    if (
      !session ||
      session.portal !== 'admin' ||
      !ADMIN_ROLES.has(session.role)
    ) {
      return redirect(request, '/admin/login');
    }

    return NextResponse.next();
  }

  if (isPath(pathname, ADMIN_ROUTES)) {
    return redirect(request, '/');
  }

  if (
    isPath(pathname, STUDENT_ROUTES) &&
    (!session || session.portal !== 'student' || session.role !== 'student')
  ) {
    return redirect(request, '/login');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*).*)',
  ],
};
