import { NextRequest, NextResponse } from 'next/server';

import { requireAdminRole } from '@/lib/auth/server';
import { updateCourseCategory } from '@/services/course.service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const { id } = await params;
    const body = await request.json();

    const result = await updateCourseCategory(
      id,
      {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
      },
      session.userId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Course category update error:', error);
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if ((error as Error).message === 'Admin account required') {
      return NextResponse.json({ error: 'Admin account required' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
