import { NextRequest, NextResponse } from 'next/server';

import { requireAdminRole } from '@/lib/auth/server';
import { createQuestion, listQuestions } from '@/services/question.service';

export async function GET(request: NextRequest) {
  try {
    await requireAdminRole(['admin', 'teacher', 'super_admin']);

    const params = request.nextUrl.searchParams;
    const questions = await listQuestions({
      courseId: params.get('courseId') || undefined,
      subject: params.get('subject') || undefined,
      topic: params.get('topic') || undefined,
      difficulty: params.get('difficulty') || undefined,
      examYear: params.get('examYear') ? Number(params.get('examYear')) : undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : undefined,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Question list error:', error);
    return NextResponse.json({ error: 'Unable to load questions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const body = await request.json();

    if (!body.courseId || !body.content || !body.difficultyLevel) {
      return NextResponse.json({ error: 'courseId, content, and difficultyLevel are required' }, { status: 400 });
    }

    const question = await createQuestion(body, session.userId);
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error('Question create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create question' },
      { status: 400 }
    );
  }
}
