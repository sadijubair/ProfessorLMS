import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { createStudentUser, logAuditEvent } from '@/services/auth.service';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, confirmPassword, fullName, mobile, whatsappNumber } =
      (await request.json()) as {
        email?: string;
        password?: string;
        confirmPassword?: string;
        fullName?: string;
        mobile?: string;
        whatsappNumber?: string;
      };

    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedMobile = mobile?.trim();
    const normalizedWhatsapp = whatsappNumber?.trim() || undefined;
    const normalizedFullName = fullName?.trim();

    // Validate input
    if (
      !normalizedEmail ||
      !password ||
      !confirmPassword ||
      !normalizedFullName ||
      !normalizedMobile
    ) {
      return NextResponse.json(
        { error: 'Full name, email, mobile, and password are required' },
        { status: 400 }
      );
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Validate mobile format (Bangladesh: 01XXXXXXXXX)
    if (!/^01\d{9}$/.test(normalizedMobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format (use 01XXXXXXXXX)' },
        { status: 400 }
      );
    }

    if (normalizedWhatsapp && !/^01\d{9}$/.test(normalizedWhatsapp)) {
      return NextResponse.json(
        { error: 'Invalid WhatsApp number format (use 01XXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Check for existing user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .or(
        `email.eq.${normalizedEmail},mobile.eq.${normalizedMobile}${
          normalizedWhatsapp ? `,whatsapp_number.eq.${normalizedWhatsapp}` : ''
        }`
      )
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email, mobile, or WhatsApp number already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const result = await createStudentUser({
      email: normalizedEmail,
      mobile: normalizedMobile,
      whatsappNumber: normalizedWhatsapp,
      fullName: normalizedFullName,
      passwordHash,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Log audit event
    await logAuditEvent(
      result.data!.id,
      'user_registration',
      'users',
      result.data!.id,
      {},
      {
        email: normalizedEmail,
        mobile: normalizedMobile,
        fullName: normalizedFullName,
        studentId: result.studentId || null,
      },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: result.data!.id,
          email: result.data!.email,
          mobile: result.data!.mobile,
          fullName: result.data!.full_name,
          studentId: result.data!.student_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
