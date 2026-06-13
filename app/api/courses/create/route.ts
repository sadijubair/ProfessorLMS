import { NextRequest, NextResponse } from 'next/server';
import { createCourse } from '@/services/course.service';
import { requireAdminRole } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);

    const body = await request.json();
    const {
      title,
      shortDescription,
      description,
      category,
      pricingType,
      priceBdt,
      durationDays,
      isFree,
      isSelfPaced,
      hasSupport,
      hasFacebookGroup,
      hasGoogleClassroom,
      hasLiveExam,
      hasWrittenExam,
      requiresManualPayment,
      curriculumSections,
      promoCode,
      discountType,
      discountValueBdt,
      expiryPeriod,
      expiryMonths,
      courseStatus,
      thumbnailUrl,
      maxStudents,
      teacherId,
    } = body;

    // Validate required fields
    if (!title || !category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

    if (!isFree && !priceBdt) {
      return NextResponse.json(
        { error: 'Price is required for paid courses' },
        { status: 400 }
      );
    }

    const result = await createCourse(
      {
        title,
        shortDescription,
        description,
        category,
        pricingType: pricingType || 'paid',
        priceBdt: priceBdt || 0,
        durationDays,
        isFree: isFree || false,
        isSelfPaced: isSelfPaced || true,
        hasSupport: hasSupport || false,
        hasFacebookGroup: hasFacebookGroup || false,
        hasGoogleClassroom: hasGoogleClassroom || false,
        hasLiveExam: hasLiveExam || false,
        hasWrittenExam: hasWrittenExam || false,
        requiresManualPayment: requiresManualPayment || false,
        curriculumSections: Array.isArray(curriculumSections) ? curriculumSections : [],
        promoCode,
        discountType,
        discountValueBdt,
        expiryPeriod,
        expiryMonths,
        courseStatus,
        thumbnailUrl,
        maxStudents,
        teacherId: teacherId || session.userId,
      },
      session.userId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        data: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Admin account required') {
      return NextResponse.json({ error: 'Admin account required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
