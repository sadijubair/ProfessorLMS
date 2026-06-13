import { NextRequest, NextResponse } from 'next/server';

import { requireAdminRole } from '@/lib/auth/server';
import {
  deleteCourse,
  publishCourse,
  unpublishCourse,
  updateCourse,
} from '@/services/course.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'publish') {
      const result = await publishCourse(id);
      return result.success
        ? NextResponse.json({ success: true })
        : NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (body.action === 'unpublish') {
      const result = await unpublishCourse(id);
      return result.success
        ? NextResponse.json({ success: true })
        : NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Price-only update — map to valid DB columns only
    if (body.action === 'update_price') {
      const priceUpdate: Record<string, unknown> = {
        is_free: Boolean(body.isFree),
        pricing_type: body.pricingType ?? (body.isFree ? 'free' : 'paid'),
        price_bdt: body.isFree ? 0 : (Number(body.priceBdt) || 0),
      };

      if (body.promoCode !== undefined) {
        priceUpdate.promo_code = body.promoCode || null;
      }
      if (body.discountType !== undefined) {
        priceUpdate.discount_type = body.discountType;
      }
      if (body.discountValueBdt !== undefined) {
        priceUpdate.discount_value_bdt = body.discountValueBdt ?? null;
      }
      if (body.expiryPeriod !== undefined) {
        priceUpdate.expiry_period = body.expiryPeriod;
      }
      if (body.expiryMonths !== undefined) {
        priceUpdate.expiry_months = body.expiryMonths ?? null;
      }

      const result = await updateCourse(id, priceUpdate, session.userId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, data: result.data });
    }

    // Generic field update — strip `action` so it never reaches Supabase as a column
    const { action: _action, teacher_ids, ...fields } = body;

    // Always sync courses.teacher_id (primary instructor) regardless of junction table
    if (Array.isArray(teacher_ids)) {
      fields.teacher_id = (teacher_ids as string[])[0] ?? null;
    }

    // Save the course fields first (this always works)
    const result = await updateCourse(id, fields, session.userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Sync junction table — non-blocking, gracefully handles missing table
    let junctionWarning: string | null = null;
    if (Array.isArray(teacher_ids)) {
      try {
        const { supabaseAdmin } = await import('@/lib/db/supabase');

        // Delete existing assignments
        const { error: delError } = await supabaseAdmin
          .from('course_instructors')
          .delete()
          .eq('course_id', id);

        if (delError) {
          // Table likely doesn't exist yet — log and continue
          console.warn('[course-instructors] Delete skipped:', delError.message);
          junctionWarning = delError.message;
        } else if ((teacher_ids as string[]).length > 0) {
          // Insert new assignments
          const rows = (teacher_ids as string[]).map((tid) => ({
            course_id: id,
            teacher_id: tid,
          }));
          const { error: insError } = await supabaseAdmin
            .from('course_instructors')
            .insert(rows);

          if (insError) {
            console.warn('[course-instructors] Insert skipped:', insError.message);
            junctionWarning = insError.message;
          }
        }
      } catch (e) {
        console.warn('[course-instructors] Unexpected error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      ...(junctionWarning ? { junctionWarning } : {}),
    });
  } catch (error) {
    console.error('Course update error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Admin account required') {
      return NextResponse.json({ error: 'Admin account required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminRole(['admin', 'super_admin']);
    const { id } = await params;
    const result = await deleteCourse(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Course delete error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Admin account required') {
      return NextResponse.json({ error: 'Admin account required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
