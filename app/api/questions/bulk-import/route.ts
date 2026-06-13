import { NextRequest, NextResponse } from 'next/server';

import { requireAdminRole } from '@/lib/auth/server';
import { bulkImportQuestions, parseQuestionCsv } from '@/services/question.service';

export async function POST(request: NextRequest) {
  try {
    const { session } = await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const { csv, courseId } = await request.json();

    if (!csv) {
      return NextResponse.json({ error: 'CSV content is required' }, { status: 400 });
    }

    const rows = parseQuestionCsv(csv, courseId);

    if (!rows.length) {
      return NextResponse.json({ error: 'No question rows found' }, { status: 400 });
    }

    if (rows.some((row) => !row.courseId || !row.content || !row.options?.length)) {
      return NextResponse.json(
        { error: 'Every row needs course_id or fallback courseId, content, and options' },
        { status: 400 }
      );
    }

    const questions = await bulkImportQuestions(rows, session.userId);
    return NextResponse.json({ count: questions.length }, { status: 201 });
  } catch (error) {
    console.error('Question bulk import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to import questions' },
      { status: 400 }
    );
  }
}
