import { NextRequest, NextResponse } from 'next/server';

import { requireStudent } from '@/lib/auth/server';
import { getPracticeQuestions } from '@/services/question.service';

export async function GET(request: NextRequest) {
  try {
    const { session } = await requireStudent();
    const params = request.nextUrl.searchParams;
    const mode = params.get('mode') || 'random';

    if (!['topic', 'timed', 'random', 'previous_year', 'weak_area'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid practice mode' }, { status: 400 });
    }

    const questions = await getPracticeQuestions({
      studentId: session.userId,
      mode: mode as 'topic' | 'timed' | 'random' | 'previous_year' | 'weak_area',
      courseId: params.get('courseId') || undefined,
      subject: params.get('subject') || undefined,
      topic: params.get('topic') || undefined,
      difficulty: params.get('difficulty') || undefined,
      examYear: params.get('examYear') ? Number(params.get('examYear')) : undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : undefined,
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Practice question error:', error);
    return NextResponse.json({ error: 'Unable to load practice questions' }, { status: 500 });
  }
}
