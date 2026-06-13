import { NextRequest, NextResponse } from 'next/server';
import { startExamAttempt } from '@/services/exam.service';
import { requireStudent } from '@/lib/auth/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { session } = await requireStudent();
    const { examId } = await context.params;
    const { practice } = await request.json();

    const result = await startExamAttempt({ examId, studentId: session.userId, practice });
    return NextResponse.json({
      attempt: result.attempt,
      deadline: result.deadline.toISOString(),
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to start attempt' },
      { status: 400 }
    );
  }
}
