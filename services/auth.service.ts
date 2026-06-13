import { supabaseAdmin } from '@/lib/db/supabase';
import { generateStudentId, generateRollNumber, generateCommunityToken } from '@/lib/auth/auth';
import type { Database } from '@/lib/db/types';

type Tables = Database['public']['Tables'];
type UserInsert = Tables['users']['Insert'];
type EnrollmentInsert = Tables['course_enrollments']['Insert'];
type PaymentInsert = Tables['payments']['Insert'];
type AuditLogInsert = Tables['audit_logs']['Insert'];
type DeviceInsert = Tables['devices']['Insert'];
type CommunityTokenInsert = Tables['community_tokens']['Insert'];
type AuditValues = Tables['audit_logs']['Row']['old_values'];
type PaymentWithEnrollment = Tables['payments']['Row'] & {
  course_enrollments: Pick<Tables['course_enrollments']['Row'], 'id' | 'student_id' | 'course_id'>;
};

// User Registration Service
export async function createStudentUser(userData: {
  email?: string;
  phone?: string;
  mobile?: string;
  whatsappNumber?: string;
  fullName: string;
  passwordHash?: string;
}) {
  try {
    // Generate unique student ID
    const studentId = await generateStudentId();

    // Check for duplicate email or phone
    if (userData.email) {
      const { data: existingEmail } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingEmail) {
        throw new Error('Email already registered');
      }
    }

    if (userData.mobile) {
      const { data: existingMobile } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('mobile', userData.mobile)
        .single();

      if (existingMobile) {
        throw new Error('Mobile number already registered');
      }
    }

    if (userData.whatsappNumber) {
      const { data: existingWhatsapp } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('whatsapp_number', userData.whatsappNumber)
        .single();

      if (existingWhatsapp) {
        throw new Error('WhatsApp number already registered');
      }
    }

    // Create user
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        email: userData.email,
        phone: userData.phone,
        mobile: userData.mobile,
        whatsapp_number: userData.whatsappNumber,
        full_name: userData.fullName,
        password_hash: userData.passwordHash,
        role: 'student',
        student_id: studentId,
        is_active: true,
      }] as unknown as UserInsert[])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data, studentId };
  } catch (error) {
    console.error('Error creating student user:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Enrollment Service
export async function enrollStudentInCourse(
  studentId: string,
  courseId: string,
  isFreeEnrollment = false
) {
  try {
    // Check if already enrolled
    const { data: existing } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (existing) {
      throw new Error('Student already enrolled in this course');
    }

    // For free courses, auto-activate
    const enrollmentStatus = isFreeEnrollment ? 'active' : 'pending';
    const paymentStatus = isFreeEnrollment ? 'approved' : 'unpaid';
    const rollNumber = isFreeEnrollment ? generateRollNumber() : null;
    const communityToken = isFreeEnrollment ? generateCommunityToken() : null;
    const activatedAt = isFreeEnrollment ? new Date().toISOString() : null;

    const result = await supabaseAdmin
      .from('course_enrollments')
      .insert([{
        student_id: studentId,
        course_id: courseId,
        enrollment_status: enrollmentStatus,
        payment_status: paymentStatus,
        roll_number: rollNumber,
        community_token: communityToken,
        activated_at: activatedAt,
      }] as unknown as EnrollmentInsert[])
      .select()
      .single();

    const { data, error } = result;

    if (error) throw error;

    // Log audit event
    await logAuditEvent(studentId, 'enrollment_created', 'course_enrollment', data.id, null, {
      studentId,
      courseId,
      enrollmentStatus,
      paymentStatus,
      rollNumber,
    });

    if (isFreeEnrollment && communityToken) {
      await supabaseAdmin.from('community_tokens').insert({
        enrollment_id: data.id,
        token: communityToken,
        status: 'unused',
        used_at: null,
        used_by: null,
      } satisfies CommunityTokenInsert);

      await logAuditEvent(studentId, 'enrollment_activated', 'course_enrollment', data.id, null, {
        studentId,
        courseId,
        rollNumber,
        communityToken,
        activationType: 'free_course',
      });

      const { createNotification } = await import('./notification.service');
      await createNotification(
        studentId,
        'enrollment',
        'Enrollment Activated',
        'Your free course enrollment is active. You can start learning now.',
        'course_enrollments',
        data.id
      );
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error enrolling student:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Payment Service
export async function submitPayment(paymentData: {
  enrollmentId: string;
  submittedBy: string;
  amountBdt: number;
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'bank_transfer';
  transactionId: string;
  senderMobile: string;
  screenshotUrl?: string;
}) {
  try {
    // Check for duplicate transaction ID
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('transaction_id', paymentData.transactionId)
      .maybeSingle();

    if (existing) {
      throw new Error('This transaction ID has already been used');
    }

    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('course_enrollments')
      .select('id, student_id, payment_status')
      .eq('id', paymentData.enrollmentId)
      .eq('student_id', paymentData.submittedBy)
      .maybeSingle();

    if (enrollmentError) throw enrollmentError;
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Reserve transaction ID
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([{
        enrollment_id: paymentData.enrollmentId,
        amount_bdt: paymentData.amountBdt,
        payment_method: paymentData.paymentMethod,
        transaction_id: paymentData.transactionId,
        sender_mobile: paymentData.senderMobile,
        screenshot_url: paymentData.screenshotUrl,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      }] as unknown as PaymentInsert[])
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from('course_enrollments')
      .update({ payment_status: 'pending' })
      .eq('id', paymentData.enrollmentId);

    await logAuditEvent(paymentData.submittedBy, 'payment_submitted', 'payments', data.id, null, {
      enrollmentId: paymentData.enrollmentId,
      amount: paymentData.amountBdt,
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error submitting payment:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Payment Approval Service (Support Staff)
export async function approvePayment(
  paymentId: string,
  approvedBy: string // support staff user_id
) {
  try {
    // Get payment and enrollment info
    const { data: payment, error: paymentError } = (await supabaseAdmin
      .from('payments')
      .select('*, course_enrollments!inner(id, student_id, course_id)')
      .eq('id', paymentId)
      .single()) as unknown as { data: PaymentWithEnrollment | null; error: Error | null };

    if (paymentError) throw paymentError;
    if (!payment) throw new Error('Payment not found');

    // Approve payment
    const updateResult = await supabaseAdmin
      .from('payments')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    
    const { error: updateError } = updateResult;

    if (updateError) throw updateError;

    // Generate roll number and community token
    const rollNumber = generateRollNumber();
    const communityToken = generateCommunityToken();

    // Activate enrollment
    const enrollmentResult = await supabaseAdmin
      .from('course_enrollments')
      .update({
        enrollment_status: 'active',
        payment_status: 'approved',
        roll_number: rollNumber,
        community_token: communityToken,
        activated_at: new Date().toISOString(),
      })
      .eq('id', payment.course_enrollments.id);
    
    const { error: enrollmentError } = enrollmentResult;

    if (enrollmentError) throw enrollmentError;

    await supabaseAdmin.from('community_tokens').insert({
      enrollment_id: payment.course_enrollments.id,
      token: communityToken,
      status: 'unused',
      used_at: null,
      used_by: null,
    } satisfies CommunityTokenInsert);

    // Log audit event
    await logAuditEvent(approvedBy, 'payment_approved', 'payments', paymentId, null, {
      paymentId,
      enrollmentId: payment.course_enrollments.id,
      amount: payment.amount_bdt,
      rollNumber,
      communityToken,
    });

    await logAuditEvent(approvedBy, 'enrollment_activated', 'course_enrollment', payment.course_enrollments.id, null, {
      paymentId,
      rollNumber,
      communityToken,
    });

    // Create notification for student
    const { createNotification } = await import('./notification.service');
    await createNotification(
      payment.course_enrollments.student_id,
      'payment_status',
      'Payment Approved',
      `Your payment of ৳${payment.amount_bdt} has been approved. Your enrollment is now active.`,
      'payments',
      paymentId
    );

    return { success: true, data: { rollNumber, communityToken } };
  } catch (error) {
    console.error('Error approving payment:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Payment Rejection Service
export async function rejectPayment(
  paymentId: string,
  rejectionReason: string,
  rejectedBy: string
) {
  try {
    // Get payment and enrollment info first
    const { data: payment } = (await supabaseAdmin
      .from('payments')
      .select('*, course_enrollments!inner(id, student_id, course_id)')
      .eq('id', paymentId)
      .single()) as unknown as { data: PaymentWithEnrollment | null };

    const rejectResult = await supabaseAdmin
      .from('payments')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', paymentId);
    
    const { error } = rejectResult;

    if (error) throw error;

    if (payment) {
      const { error: enrollmentError } = await supabaseAdmin
        .from('course_enrollments')
        .update({ payment_status: 'rejected' })
        .eq('id', payment.course_enrollments.id);

      if (enrollmentError) throw enrollmentError;
    }

    // Log audit event
    await logAuditEvent(rejectedBy, 'payment_rejected', 'payments', paymentId, null, {
      rejectionReason,
    });

    // Create notification for student
    if (payment) {
      const { createNotification } = await import('./notification.service');
      await createNotification(
        payment.course_enrollments.student_id,
        'payment_status',
        'Payment Rejected',
        `Your payment has been rejected. Reason: ${rejectionReason}. Please review and resubmit.`,
        'payments',
        paymentId
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Audit Logging Service
export async function logAuditEvent(
  userId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValues: AuditValues,
  newValues: AuditValues,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await supabaseAdmin.from('audit_logs').insert([{
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent,
    }] as unknown as AuditLogInsert[]);
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

// Device Management Service
export async function registerDevice(
  userId: string,
  deviceInfo: {
    deviceName: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser: string;
    os: string;
    ipAddress: string;
    locationApproximate?: string;
  }
) {
  try {
    const deviceFingerprint = generateDeviceFingerprint(deviceInfo);

    const { data: existingDevice, error: existingDeviceError } =
      await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .eq('device_fingerprint', deviceFingerprint)
        .eq('is_active', true)
        .maybeSingle();

    if (existingDeviceError) throw existingDeviceError;

    if (existingDevice) {
      const { data, error } = await supabaseAdmin
        .from('devices')
        .update({
          last_active_at: new Date().toISOString(),
          ip_address: deviceInfo.ipAddress,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        })
        .eq('id', existingDevice.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    }

    // Check active device count
    const { data: activeDevices } = await supabaseAdmin
      .from('devices')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (activeDevices && activeDevices.length >= 2) {
      return {
        success: false,
        error: 'Device limit reached. Maximum 2 active devices allowed.',
        blocked: true,
      };
    }

    // Register new device
    const { data, error } = await supabaseAdmin
      .from('devices')
      .insert([{
        user_id: userId,
        device_name: deviceInfo.deviceName,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_fingerprint: deviceFingerprint,
        ip_address: deviceInfo.ipAddress,
        location_approximate: deviceInfo.locationApproximate,
        last_active_at: new Date().toISOString(),
        is_active: true,
      }] as unknown as DeviceInsert[])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error registering device:', error);
    return { success: false, error: (error as Error).message };
  }
}

function generateDeviceFingerprint(deviceInfo: {
  browser: string;
  os: string;
  ipAddress: string;
}): string {
  return Buffer.from(`${deviceInfo.browser}-${deviceInfo.os}-${deviceInfo.ipAddress}`).toString(
    'base64'
  );
}
