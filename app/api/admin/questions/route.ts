import { NextRequest, NextResponse } from 'next/server';
import { listQuestions } from '@/services/question.service';
import { requireAdminRole } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(['admin', 'teacher', 'super_admin', 'mentor']);

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const subject = searchParams.get('subject') ?? undefined;
    const topic = searchParams.get('topic') ?? undefined;
    const difficulty = searchParams.get('difficulty') ?? undefined;
    const examYear = searchParams.get('examYear') ? Number(searchParams.get('examYear')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;

    const questions = await listQuestions({ courseId, subject, topic, difficulty, examYear, limit });
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('List admin questions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load questions' },
      { status: 500 }
    );
  }
}
