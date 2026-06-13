import { NextRequest, NextResponse } from 'next/server';
import { saveAnswer, toggleReviewMark } from '@/services/exam.service';
import { requireStudent } from '@/lib/auth/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { session } = await requireStudent();
    const { attemptId } = await context.params;
    const body = await request.json();

    if (!body.questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      );
    }

    const answer =
      body.selectedOptionId || body.answerText
        ? await saveAnswer({
            attemptId,
            studentId: session.userId,
            questionId: body.questionId,
            selectedOptionId: body.selectedOptionId,
            answerText: body.answerText,
            markedForReview: body.markedForReview,
            timeSpentSeconds: body.timeSpentSeconds,
          })
        : await toggleReviewMark({
            attemptId,
            studentId: session.userId,
            questionId: body.questionId,
            markedForReview: Boolean(body.markedForReview),
          });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Save answer error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save answer' },
      { status: 400 }
    );
  }
}
