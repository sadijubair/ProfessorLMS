import { NextResponse } from 'next/server';
import { getExamLeaderboard, getExamWindowState } from '@/services/exam.service';
import { requireStudent } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  _request: Request,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { session } = await requireStudent();
    const { examId } = await context.params;
    const { data: exam, error } = await supabaseAdmin
      .from('exams')
      .select('id, course_id, window_start_at, window_end_at')
      .eq('id', examId)
      .single();

    if (error) throw error;

    // Open exams (course_id = null) are accessible to any registered student
    if (exam.course_id) {
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('course_enrollments')
        .select('id')
        .eq('student_id', session.userId)
        .eq('course_id', exam.course_id)
        .eq('enrollment_status', 'active')
        .maybeSingle();

      if (enrollmentError) throw enrollmentError;
      if (!enrollment) {
        return NextResponse.json({ error: 'Enrollment required' }, { status: 403 });
      }
    }

    if (getExamWindowState(exam) !== 'closed') {
      return NextResponse.json({ error: 'Leaderboard is available after the exam window closes' }, { status: 403 });
    }

    const leaderboard = await getExamLeaderboard(examId);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Unable to load leaderboard' }, { status: 500 });
  }
}
