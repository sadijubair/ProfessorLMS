import { NextRequest, NextResponse } from 'next/server';
import { createExam, listAvailableExams } from '@/services/exam.service';
import { requireAdminRole, requireStudent } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const { session } = await requireStudent();
    const exams = await listAvailableExams(session.userId);
    return NextResponse.json({ exams });
  } catch (error) {
    console.error('List exams error:', error);
    return NextResponse.json({ error: 'Unable to load exams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const body = await request.json();

    const required = [
      'courseId',
      'title',
      'examType',
      'totalMarks',
      'windowStartAt',
      'windowEndAt',
      'individualDurationMinutes',
    ];

    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const exam = await createExam({ ...body, createdBy: session.userId });
    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error('Create exam error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create exam' },
      { status: 500 }
    );
  }
}
