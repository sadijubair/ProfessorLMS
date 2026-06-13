import { NextRequest, NextResponse } from 'next/server';
import {
  getExamAdmin,
  updateExam,
  deleteExam,
} from '@/services/exam.service';
import { requireAdminRole } from '@/lib/auth/server';

type Params = { params: Promise<{ examId: string }> };

export async function GET(_request: NextRequest, context: Params) {
  try {
    await requireAdminRole(['admin', 'teacher', 'super_admin', 'mentor']);
    const { examId } = await context.params;
    const result = await getExamAdmin(examId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get exam admin error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load exam' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: Params) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const { examId } = await context.params;
    const body = await request.json();
    const exam = await updateExam(examId, body, session.userId);
    return NextResponse.json({ exam });
  } catch (error) {
    console.error('Update exam error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update exam' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: Params) {
  try {
    const { session } = await requireAdminRole(['admin', 'super_admin']);
    const { examId } = await context.params;
    await deleteExam(examId, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete exam error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete exam' },
      { status: 500 }
    );
  }
}
