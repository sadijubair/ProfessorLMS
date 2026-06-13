import { NextRequest, NextResponse } from 'next/server';
import { replaceExamQuestions } from '@/services/exam.service';
import { requireAdminRole } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

type Params = { params: Promise<{ examId: string }> };

export async function GET(_request: NextRequest, context: Params) {
  try {
    await requireAdminRole(['admin', 'teacher', 'super_admin', 'mentor']);
    const { examId } = await context.params;

    const { data, error } = await supabaseAdmin
      .from('exam_questions')
      .select('*, questions(id, content, subject, topic, difficulty_level, type, question_options(id, option_label, option_text, is_correct))')
      .eq('exam_id', examId)
      .order('sequence_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ questions: data });
  } catch (error) {
    console.error('Get exam questions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load questions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: Params) {
  try {
    await requireAdminRole(['admin', 'teacher', 'super_admin']);
    const { examId } = await context.params;
    const body = await request.json();

    const { questions } = body as {
      questions: Array<{ questionId: string; sequenceOrder: number; marks: number }>;
    };

    if (!Array.isArray(questions)) {
      return NextResponse.json({ error: 'questions array is required' }, { status: 400 });
    }

    const result = await replaceExamQuestions(examId, questions);
    return NextResponse.json({ questions: result });
  } catch (error) {
    console.error('Replace exam questions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save questions' },
      { status: 500 }
    );
  }
}
