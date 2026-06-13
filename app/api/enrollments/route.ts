import { NextRequest, NextResponse } from 'next/server';
import { enrollStudentInCourse } from '@/services/auth.service';
import { requireStudent } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireStudent();
    const { courseId } = await request.json();

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing course ID' },
        { status: 400 }
      );
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('id, is_free, title')
      .eq('id', courseId)
      .not('published_at', 'is', null)
      .maybeSingle();

    if (courseError) throw courseError;

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Enroll student
    const result = await enrollStudentInCourse(
      session.userId,
      courseId,
      course.is_free
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: course.is_free
          ? 'Enrollment activated successfully'
          : 'Enrollment created successfully',
        data: result.data,
        requiresPayment: !course.is_free,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Enrollment error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Student account required') {
      return NextResponse.json({ error: 'Student account required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
