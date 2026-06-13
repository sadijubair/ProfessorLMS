import { NextRequest, NextResponse } from 'next/server';

import { requireAdminRole } from '@/lib/auth/server';
import {
  createCourseCategory,
  listCourseCategories,
} from '@/services/course.service';

export async function GET() {
  const result = await listCourseCategories(true);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const { name, description, isActive } = await request.json();

    const result = await createCourseCategory(
      { name, description, isActive },
      session.userId
    );

    if (!result.success) {
      if (result.error?.includes('course_categories')) {
        return NextResponse.json(
          {
            error:
              'Course categories table is missing in Supabase. Run the add_course_categories migration and refresh the Supabase schema cache.',
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('Course category create error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Admin account required') {
      return NextResponse.json({ error: 'Admin account required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
