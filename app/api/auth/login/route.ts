import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import bcrypt from 'bcryptjs';
import { registerDevice } from '@/services/auth.service';
import type { UserRole } from '@/lib/auth/rbac';
import type { Database } from '@/lib/db/types';
import {
  createSessionPayload,
  signSession,
  verifyCaptchaAnswer,
} from '@/lib/auth/session';

type LoginPortal = 'student' | 'admin';
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

const ADMIN_ROLES = new Set<UserRole>([
  'admin',
  'teacher',
  'support',
  'super_admin',
]);

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      mobileOrEmail,
      portal = 'student',
      captchaAnswer,
      captchaToken,
    } = (await request.json()) as {
      email?: string;
      password?: string;
      mobileOrEmail?: string;
      portal?: LoginPortal;
      captchaAnswer?: string;
      captchaToken?: string;
    };

    // Support both email and mobile login
    const loginIdentifier = (email || mobileOrEmail || '').trim();

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: 'Email/Mobile and password required' },
        { status: 400 }
      );
    }

    if (portal === 'admin') {
      const captchaValid =
        captchaAnswer &&
        captchaToken &&
        (await verifyCaptchaAnswer(captchaToken, captchaAnswer));

      if (!captchaValid) {
        return NextResponse.json(
          { error: 'Captcha verification failed' },
          { status: 400 }
        );
      }
    }

    // Find user by email or mobile
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .or(`email.eq.${loginIdentifier},mobile.eq.${loginIdentifier}`)
      .maybeSingle();

    if (!user || userError) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Please use Google OAuth or reset your password' },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }

    if (portal === 'admin' && !ADMIN_ROLES.has(user.role)) {
      return NextResponse.json(
        { error: 'This account is not allowed to access the admin portal' },
        { status: 403 }
      );
    }

    if (portal === 'student' && user.role !== 'student') {
      return NextResponse.json(
        { error: 'Please use the admin portal for this account' },
        { status: 403 }
      );
    }

    // Get device info from request headers
    const ua = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Simple device type detection
    const isDeviceType = (agent: string): 'mobile' | 'tablet' | 'desktop' => {
      if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(agent.toLowerCase())) {
        return 'mobile';
      }
      if (/ipad|android/i.test(agent.toLowerCase())) {
        return 'tablet';
      }
      return 'desktop';
    };

    const deviceType = isDeviceType(ua);
    const deviceName = `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} - ${new Date().toLocaleDateString()}`;

    // Extract browser and OS from user agent (simplified)
    const isBrowser = (agent: string): string => {
      if (/Chrome/i.test(agent)) return 'Chrome';
      if (/Safari/i.test(agent)) return 'Safari';
      if (/Firefox/i.test(agent)) return 'Firefox';
      if (/Edge/i.test(agent)) return 'Edge';
      return 'Unknown';
    };

    const isOS = (agent: string): string => {
      if (/Windows/i.test(agent)) return 'Windows';
      if (/Mac/i.test(agent)) return 'macOS';
      if (/Linux/i.test(agent)) return 'Linux';
      if (/iPhone|iPad|iPod/i.test(agent)) return 'iOS';
      if (/Android/i.test(agent)) return 'Android';
      return 'Unknown';
    };

    const browser = isBrowser(ua);
    const os = isOS(ua);

    // Register device
    const deviceRegResult = await registerDevice(user.id, {
      deviceName,
      deviceType,
      browser,
      os,
      ipAddress: ip.split(',')[0].trim(),
    });

    if (!deviceRegResult.success) {
      return NextResponse.json(
        {
          error: deviceRegResult.error,
          blocked: deviceRegResult.blocked || false,
        },
        { status: 429 }
      );
    }

    // Update last login time
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'user_login',
      entity_type: 'users',
      entity_id: user.id,
      old_values: null,
      new_values: { device_id: deviceRegResult.data?.id || null },
      ip_address: ip.split(',')[0].trim(),
      user_agent: ua,
    } satisfies AuditLogInsert);

    const sessionToken = await signSession(
      createSessionPayload({
        userId: user.id,
        studentId: user.student_id,
        role: user.role,
        portal,
      })
    );

    // Return response with session cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          fullName: user.full_name,
          studentId: user.student_id,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set secure httpOnly cookie
    response.cookies.set('sb-session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
