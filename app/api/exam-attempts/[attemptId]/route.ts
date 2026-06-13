import { NextRequest, NextResponse } from 'next/server';
import { getAttemptPayload } from '@/services/exam.service';
import { requireStudent } from '@/lib/auth/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { session } = await requireStudent();
    const { attemptId } = await context.params;

    const payload = await getAttemptPayload(attemptId, session.userId);
    return NextResponse.json({
      ...payload,
      deadline: payload.deadline.toISOString(),
    });
  } catch (error) {
    console.error('Attempt payload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load attempt' },
      { status: 500 }
    );
  }
}
