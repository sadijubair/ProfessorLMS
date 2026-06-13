import { NextRequest, NextResponse } from 'next/server';
import { listExamsAdmin } from '@/services/exam.service';
import { requireAdminRole } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(['admin', 'teacher', 'super_admin', 'mentor']);

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') as 'course' | 'open' | null;
    const courseId = searchParams.get('courseId');
    const examType = searchParams.get('examType') as 'mcq' | 'written' | 'combined' | null;

    const exams = await listExamsAdmin({
      scope: scope ?? undefined,
      courseId: courseId ?? undefined,
      examType: examType ?? undefined,
    });

    return NextResponse.json({ exams });
  } catch (error) {
    console.error('List admin exams error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load exams' },
      { status: 500 }
    );
  }
}
