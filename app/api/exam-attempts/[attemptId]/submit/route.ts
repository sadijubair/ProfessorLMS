import { NextRequest, NextResponse } from 'next/server';
import { submitAttempt } from '@/services/exam.service';
import { requireStudent } from '@/lib/auth/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { session } = await requireStudent();
    const { attemptId } = await context.params;
    const { reason } = await request.json();

    const attempt = await submitAttempt(attemptId, session.userId, { reason });
    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Submit attempt error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to submit attempt' },
      { status: 400 }
    );
  }
}
