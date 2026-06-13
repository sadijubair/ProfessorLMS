import { supabaseAdmin } from '@/lib/db/supabase';
import type { Database } from '@/lib/db/types';
import { logAuditEvent } from '@/services/auth.service';

type Tables = Database['public']['Tables'];

type BookInsert = Tables['books']['Insert'];
type OrderInsert = Tables['orders']['Insert'];
type PromoCodeInsert = Tables['promo_codes']['Insert'];
type SubmissionInsert = Tables['submission_acknowledgments']['Insert'];
type CommunityTokenRow = Tables['community_tokens']['Row'];

export type BookRecord = Tables['books']['Row'];
export type OrderRecord = OrderInsert & {
  id: string;
  created_at: string;
  updated_at: string;
  books?: Pick<Tables['books']['Row'], 'title' | 'price_bdt' | 'image_url'>;
  users?: Pick<Tables['users']['Row'], 'full_name' | 'student_id' | 'mobile'>;
};
export type PromoCodeRecord = Tables['promo_codes']['Row'];
export type SubmissionRecord = SubmissionInsert & {
  id: string;
  exams?: Pick<Tables['exams']['Row'], 'title' | 'exam_type'>;
  users?: Pick<Tables['users']['Row'], 'full_name' | 'student_id'>;
};

type OrderRow = Tables['orders']['Row'];
type UserRow = Pick<Tables['users']['Row'], 'id' | 'full_name' | 'student_id' | 'mobile'>;
type BookRow = Pick<Tables['books']['Row'], 'id' | 'title' | 'price_bdt' | 'image_url'>;
type ExamRow = Pick<Tables['exams']['Row'], 'id' | 'title' | 'exam_type'>;
type AttemptRow = Pick<Tables['exam_attempts']['Row'], 'id' | 'exam_id' | 'student_id' | 'roll_number'>;

export async function listBooks(includeInactive = false) {
  let query = supabaseAdmin.from('books').select('*').order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as BookRecord[];
}

export async function createBook(
  input: {
    title: string;
    author?: string;
    description?: string;
    priceBdt: number;
    stockQuantity: number;
    imageUrl?: string;
    isActive?: boolean;
  },
  createdBy: string
) {
  const { data, error } = await supabaseAdmin
    .from('books')
    .insert([
      {
        title: input.title,
        author: input.author || null,
        description: input.description || null,
        price_bdt: input.priceBdt,
        stock_quantity: input.stockQuantity,
        image_url: input.imageUrl || null,
        is_active: input.isActive ?? true,
        created_by: createdBy,
      } satisfies BookInsert,
    ])
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(createdBy, 'book_created', 'books', data.id, null, {
    title: input.title,
    priceBdt: input.priceBdt,
    stockQuantity: input.stockQuantity,
  });

  return data as BookRecord;
}

export async function listOrders(studentId?: string) {
  let query = supabaseAdmin
    .from('orders')
    .select('id, student_id, book_id, quantity, total_price_bdt, payment_status, shipping_status, shipping_address, notes, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const orders = (data || []) as OrderRow[];
  if (!orders.length) {
    return [] as OrderRecord[];
  }

  const bookIds = [...new Set(orders.map((order) => order.book_id))];
  const studentIds = [...new Set(orders.map((order) => order.student_id))];

  const [{ data: booksData }, { data: usersData }] = await Promise.all([
    supabaseAdmin.from('books').select('id, title, price_bdt, image_url').in('id', bookIds),
    supabaseAdmin.from('users').select('id, full_name, student_id, mobile').in('id', studentIds),
  ]);

  const booksById = new Map((booksData || []).map((book) => [book.id, book as BookRow]));
  const usersById = new Map((usersData || []).map((user) => [user.id, user as UserRow]));

  return orders.map((order) => ({
    ...order,
    books: booksById.get(order.book_id),
    users: usersById.get(order.student_id),
  })) as OrderRecord[];
}

export async function createOrder(input: {
  studentId: string;
  bookId: string;
  quantity: number;
  shippingAddress: string;
  notes?: string;
}) {
  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .select('id, title, price_bdt, stock_quantity, is_active')
    .eq('id', input.bookId)
    .maybeSingle();

  if (bookError) throw bookError;
  if (!book || !book.is_active) {
    throw new Error('Book is not available');
  }

  const quantity = Math.max(1, Math.floor(input.quantity || 1));
  const totalPrice = book.price_bdt * quantity;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert([
      {
        student_id: input.studentId,
        book_id: input.bookId,
        quantity,
        total_price_bdt: totalPrice,
        payment_status: 'pending',
        shipping_status: 'pending',
        shipping_address: input.shippingAddress,
        notes: input.notes || null,
      } satisfies OrderInsert,
    ])
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(input.studentId, 'book_order_created', 'orders', data.id, null, {
    bookId: input.bookId,
    quantity,
    totalPrice,
  });

  return data;
}

export async function updateOrderShipping(
  orderId: string,
  shippingStatus: OrderInsert['shipping_status'],
  updatedBy: string
) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ shipping_status: shippingStatus })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(updatedBy, 'order_shipping_updated', 'orders', orderId, null, {
    shippingStatus,
  });

  return data;
}

export async function listPromoCodes(includeInactive = true) {
  let query = supabaseAdmin.from('promo_codes').select('*').order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as PromoCodeRecord[];
}

export async function createPromoCode(
  input: {
    code: string;
    discountPercent?: number;
    discountFixedBdt?: number | null;
    scope: PromoCodeInsert['scope'];
    applicableCourses?: string[] | null;
    maxUses?: number | null;
    validFrom: string;
    validUntil: string;
    isActive?: boolean;
  },
  createdBy: string
) {
  const { data, error } = await supabaseAdmin
    .from('promo_codes')
    .insert([
      {
        code: input.code.trim().toUpperCase(),
        discount_percent: input.discountPercent ?? 0,
        discount_fixed_bdt: input.discountFixedBdt ?? null,
        scope: input.scope,
        applicable_courses: input.applicableCourses ?? null,
        max_uses: input.maxUses ?? null,
        valid_from: input.validFrom,
        valid_until: input.validUntil,
        is_active: input.isActive ?? true,
        created_by: createdBy,
      } satisfies PromoCodeInsert,
    ])
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(createdBy, 'promo_code_created', 'promo_codes', data.id, null, {
    code: data.code,
    scope: data.scope,
  });

  return data as PromoCodeRecord;
}

export async function listWrittenSubmissions(studentId?: string) {
  let query = supabaseAdmin
    .from('submission_acknowledgments')
    .select('id, attempt_id, exam_id, student_id, roll_number, status, submission_platform, submission_url, submitted_at, acknowledged_at, marks_entered_by, marks_entered_at')
    .order('submitted_at', { ascending: false });

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const submissions = (data || []) as SubmissionInsert[];
  if (!submissions.length) {
    return [] as SubmissionRecord[];
  }

  const examIds = [...new Set(submissions.map((submission) => submission.exam_id))];
  const studentIds = [...new Set(submissions.map((submission) => submission.student_id))];

  const [{ data: examsData }, { data: usersData }] = await Promise.all([
    supabaseAdmin.from('exams').select('id, title, exam_type').in('id', examIds),
    supabaseAdmin.from('users').select('id, full_name, student_id').in('id', studentIds),
  ]);

  const examsById = new Map((examsData || []).map((exam) => [exam.id, exam as ExamRow]));
  const usersById = new Map((usersData || []).map((user) => [user.id, user as Pick<UserRow, 'id' | 'full_name' | 'student_id'>]));

  return submissions.map((submission) => ({
    ...submission,
    exams: examsById.get(submission.exam_id),
    users: usersById.get(submission.student_id),
  })) as SubmissionRecord[];
}

export async function acknowledgeWrittenSubmission(input: {
  studentId: string;
  attemptId: string;
  submissionPlatform: SubmissionInsert['submission_platform'];
  submissionUrl?: string;
  submittedAt?: string;
}) {
  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('exam_attempts')
    .select('id, exam_id, student_id, roll_number')
    .eq('id', input.attemptId)
    .eq('student_id', input.studentId)
    .maybeSingle();

  if (attemptError) throw attemptError;
  if (!attempt) throw new Error('Attempt not found');

  const typedAttempt = attempt as AttemptRow;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('submission_acknowledgments')
    .select('id')
    .eq('attempt_id', input.attemptId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from('submission_acknowledgments')
    .insert([
      {
        attempt_id: input.attemptId,
        exam_id: typedAttempt.exam_id,
        student_id: input.studentId,
        roll_number: typedAttempt.roll_number || '',
        status: 'pending',
        submission_platform: input.submissionPlatform,
        submission_url: input.submissionUrl || null,
        submitted_at: input.submittedAt || new Date().toISOString(),
        acknowledged_at: new Date().toISOString(),
        marks_entered_by: null,
        marks_entered_at: null,
      } satisfies SubmissionInsert,
    ])
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(input.studentId, 'written_submission_acknowledged', 'submission_acknowledgments', data.id, null, {
    attemptId: input.attemptId,
    examId: typedAttempt.exam_id,
  });

  return data;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionInsert['status'],
  reviewedBy: string
) {
  const { data, error } = await supabaseAdmin
    .from('submission_acknowledgments')
    .update({
      status,
      marks_entered_by: reviewedBy,
      marks_entered_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(reviewedBy, 'written_submission_status_updated', 'submission_acknowledgments', submissionId, null, {
    status,
  });

  return data;
}

export async function listCommunityTokens(userId?: string) {
  let query = supabaseAdmin
    .from('community_tokens')
    .select('id, enrollment_id, token, status, used_at, used_by, created_at')
    .order('created_at', { ascending: false });

  if (userId) {
    const { data: userEnrollments, error: enrollmentError } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('student_id', userId);

    if (enrollmentError) throw enrollmentError;

    const enrollmentIds = (userEnrollments || []).map((enrollment) => enrollment.id);

    if (!enrollmentIds.length) {
      return [];
    }

    query = query.in('enrollment_id', enrollmentIds);
  }

  const { data, error } = await query;

  if (error) throw error;

  const tokens = (data || []) as CommunityTokenRow[];
  if (!tokens.length) {
    return [];
  }

  const enrollmentIds = [...new Set(tokens.map((token) => token.enrollment_id))];

  const { data: enrollmentsData, error: enrollmentsError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id, student_id, roll_number, course_id')
    .in('id', enrollmentIds);

  if (enrollmentsError) throw enrollmentsError;

  const enrollments = enrollmentsData || [];
  const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.course_id))];
  const studentIds = [...new Set(enrollments.map((enrollment) => enrollment.student_id))];

  const [{ data: coursesData }, { data: usersData }] = await Promise.all([
    supabaseAdmin.from('courses').select('id, title').in('id', courseIds),
    supabaseAdmin.from('users').select('id, full_name, student_id, mobile').in('id', studentIds),
  ]);

  const coursesById = new Map((coursesData || []).map((course) => [course.id, course as Pick<Tables['courses']['Row'], 'id' | 'title'>]));
  const usersById = new Map((usersData || []).map((user) => [user.id, user as UserRow]));
  const enrollmentsById = new Map(
    enrollments.map((enrollment) => [
      enrollment.id,
      {
        ...enrollment,
        courses: coursesById.get(enrollment.course_id),
      },
    ])
  );

  return tokens.map((token) => ({
    ...token,
    course_enrollments: enrollmentsById.get(token.enrollment_id),
    users: usersById.get(enrollmentsById.get(token.enrollment_id)?.student_id || ''),
  })) as Array<CommunityTokenRow & {
    course_enrollments?: { student_id: string; roll_number: string | null; courses?: { title: string } };
    users?: Pick<Tables['users']['Row'], 'full_name' | 'student_id' | 'mobile'>;
  }>;
}

export async function consumeCommunityToken(tokenId: string, usedBy: string) {
  const { data, error } = await supabaseAdmin
    .from('community_tokens')
    .update({
      status: 'used',
      used_by: usedBy,
      used_at: new Date().toISOString(),
    })
    .eq('id', tokenId)
    .select()
    .single();

  if (error) throw error;

  await logAuditEvent(usedBy, 'community_token_consumed', 'community_tokens', tokenId, null, {
    status: 'used',
  });

  return data;
}
