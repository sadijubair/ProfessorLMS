import { NextRequest, NextResponse } from 'next/server';

import { requireStudent } from '@/lib/auth/server';
import { submitPracticeAnswer } from '@/services/question.service';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireStudent();
    const body = await request.json();

    if (!body.questionId || !body.selectedOptionId || !body.practiceMode) {
      return NextResponse.json(
        { error: 'questionId, selectedOptionId, and practiceMode are required' },
        { status: 400 }
      );
    }

    const attempt = await submitPracticeAnswer({
      studentId: session.userId,
      questionId: body.questionId,
      selectedOptionId: body.selectedOptionId,
      practiceMode: body.practiceMode,
      timeSpentSeconds: body.timeSpentSeconds,
    });

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Practice answer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to submit answer' },
      { status: 400 }
    );
  }
}
