import { supabaseAdmin } from '@/lib/db/supabase';
import type { Database } from '@/lib/db/types';
import { logAuditEvent } from '@/services/auth.service';

type Tables = Database['public']['Tables'];
type Exam = Tables['exams']['Row'];
type ExamInsert = Tables['exams']['Insert'];
type ExamQuestionInsert = Tables['exam_questions']['Insert'];
type ExamAttemptInsert = Tables['exam_attempts']['Insert'];
type ExamAttemptUpdate = Tables['exam_attempts']['Update'];
type AnswerInsert = Tables['answers']['Insert'];
type AnswerUpdate = Tables['answers']['Update'];
type LeaderboardInsert = Tables['leaderboards']['Insert'];

type ExamQuestionWithQuestion = Tables['exam_questions']['Row'] & {
  questions: Tables['questions']['Row'] & {
    question_options: Tables['question_options']['Row'][];
  };
};
type AttemptWithExam = Tables['exam_attempts']['Row'] & { exams: Exam };
type AnswerRow = Tables['answers']['Row'];
type AggregateAttemptRow = Pick<
  Tables['exam_attempts']['Row'],
  | 'student_id'
  | 'total_marks_obtained'
  | 'total_correct'
  | 'total_wrong'
  | 'total_questions_attempted'
> & {
  users: Pick<Tables['users']['Row'], 'full_name' | 'student_id'>;
};
type ExpiringAttemptRow = Pick<
  Tables['exam_attempts']['Row'],
  'id' | 'student_id' | 'started_at' | 'is_official'
> & {
  exams: Pick<Exam, 'window_end_at' | 'individual_duration_minutes'>;
};

export type ExamWindowState = 'upcoming' | 'live' | 'closed';

export function getExamWindowState(
  exam: Pick<Exam, 'window_start_at' | 'window_end_at'>,
  now = new Date()
): ExamWindowState {
  const startAt = new Date(exam.window_start_at);
  const endAt = new Date(exam.window_end_at);

  if (now < startAt) return 'upcoming';
  if (now > endAt) return 'closed';
  return 'live';
}

export function calculateAttemptDeadline(
  exam: Pick<Exam, 'window_end_at' | 'individual_duration_minutes'>,
  startedAt = new Date(),
  isOfficial = true
): Date {
  const durationDeadline = new Date(
    startedAt.getTime() + exam.individual_duration_minutes * 60_000
  );

  if (!isOfficial) {
    return durationDeadline;
  }

  const windowDeadline = new Date(exam.window_end_at);
  return durationDeadline < windowDeadline ? durationDeadline : windowDeadline;
}

export async function listAvailableExams(studentId: string) {
  await submitExpiredAttempts(studentId);

  // Get enrolled course IDs
  const { data: enrollments, error } = await supabaseAdmin
    .from('course_enrollments')
    .select('course_id')
    .eq('student_id', studentId)
    .eq('enrollment_status', 'active');

  if (error) throw error;

  const courseIds = enrollments.map((e) => e.course_id);

  // Parallel: course-specific exams + open exams
  const [courseExamsResult, openExamsResult] = await Promise.all([
    courseIds.length > 0
      ? supabaseAdmin
          .from('exams')
          .select('*')
          .eq('scope', 'course')
          .in('course_id', courseIds)
          .not('published_at', 'is', null)
      : Promise.resolve({ data: [], error: null }),
    supabaseAdmin
      .from('exams')
      .select('*')
      .eq('scope', 'open')
      .not('published_at', 'is', null),
  ]);

  if (courseExamsResult.error) throw courseExamsResult.error;
  if (openExamsResult.error) throw openExamsResult.error;

  // Merge + deduplicate
  const allExams = [
    ...(courseExamsResult.data ?? []),
    ...(openExamsResult.data ?? []),
  ];
  const unique = Array.from(new Map(allExams.map((e) => [e.id, e])).values());

  return unique
    .sort((a, b) => new Date(a.window_start_at).getTime() - new Date(b.window_start_at).getTime())
    .map((exam) => ({
      ...exam,
      window_state: getExamWindowState(exam),
      practice_available: getExamWindowState(exam) === 'closed' && exam.exam_type !== 'written',
    }));
}

export async function createExam(input: {
  courseId?: string | null;          // null/undefined for open exams
  scope?: 'course' | 'open';        // defaults to 'course' if courseId provided
  title: string;
  description?: string;
  examType: 'mcq' | 'written' | 'combined';
  totalMarks: number;
  passingMarks?: number;
  negativeMarking?: number;          // MCQ: always applied. Combined: MCQ portion only. Written: ignored.
  windowStartAt: string;
  windowEndAt: string;
  individualDurationMinutes: number;
  shuffleQuestions?: boolean;
  showAnswersAfter?: boolean;
  instructions?: string;
  createdBy: string;
  questionIds?: string[];
  publishNow?: boolean;
}) {
  // Negative marking rules:
  //   written  → always 0
  //   mcq      → as provided
  //   combined → applies to MCQ portion (same value used in scoring loop per question type)
  const negativeMarking = input.examType === 'written' ? 0 : (input.negativeMarking ?? 0);

  const scope = input.scope ?? (input.courseId ? 'course' : 'open');

  const examPayload: ExamInsert = {
    course_id: input.courseId ?? null,
    scope,
    title: input.title,
    description: input.description ?? null,
    exam_type: input.examType,
    total_questions: input.questionIds?.length ?? 0,
    total_marks: input.totalMarks,
    passing_marks: input.passingMarks ?? null,
    negative_marking: negativeMarking,
    window_start_at: input.windowStartAt,
    window_end_at: input.windowEndAt,
    individual_duration_minutes: input.individualDurationMinutes,
    shuffle_questions: input.shuffleQuestions ?? false,
    show_answers_after: input.showAnswersAfter ?? true,
    instructions: input.instructions ?? null,
    created_by: input.createdBy,
    published_at: input.publishNow ? new Date().toISOString() : null,
  };

  const { data: exam, error } = await supabaseAdmin
    .from('exams')
    .insert([examPayload])
    .select()
    .single();

  if (error) throw error;

  if (input.questionIds && input.questionIds.length > 0) {
    await assignQuestionsToExam(
      exam.id,
      input.questionIds.map((questionId, index) => ({
        questionId,
        sequenceOrder: index + 1,
        marks: input.totalMarks / input.questionIds!.length,
      }))
    );
  }

  await logAuditEvent(input.createdBy, 'exam_created', 'exams', exam.id, null, {
    title: input.title,
    courseId: input.courseId ?? null,
    examType: input.examType,
  });

  return exam;
}

export async function assignQuestionsToExam(
  examId: string,
  questions: Array<{ questionId: string; sequenceOrder: number; marks?: number }>
) {
  const rows: ExamQuestionInsert[] = questions.map((question) => ({
    exam_id: examId,
    question_id: question.questionId,
    sequence_order: question.sequenceOrder,
    marks: question.marks ?? 1,
  }));

  const { data, error } = await supabaseAdmin
    .from('exam_questions')
    .upsert(rows, { onConflict: 'exam_id,question_id' })
    .select();

  if (error) throw error;
  return data;
}

export async function startExamAttempt(input: {
  examId: string;
  studentId: string;
  practice?: boolean;
}) {
  const { data: exam, error: examError } = await supabaseAdmin
    .from('exams')
    .select('*')
    .eq('id', input.examId)
    .single();

  if (examError) throw examError;
  if (!exam.published_at) throw new Error('Exam is not published');

  const windowState = getExamWindowState(exam);
  const isPractice = input.practice || windowState === 'closed';
  const isOfficial = !isPractice;

  if (windowState === 'upcoming') {
    throw new Error('Exam has not started yet');
  }

  if (isOfficial && windowState !== 'live') {
    throw new Error('Official exam window is closed');
  }

  if (isPractice && exam.exam_type === 'written') {
    throw new Error('Practice mode is only available for MCQ or combined exams');
  }

  // Enrollment check: required for course-scoped exams, skipped for open exams
  let rollNumber: string | null = null;
  if ((exam as any).scope !== 'open' && exam.course_id) {
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('course_enrollments')
      .select('roll_number')
      .eq('student_id', input.studentId)
      .eq('course_id', exam.course_id)
      .eq('enrollment_status', 'active')
      .single();

    if (enrollmentError) throw enrollmentError;
    rollNumber = enrollment.roll_number;
  }

  if (isOfficial) {
    const { data: existingAttempt, error: existingError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', input.examId)
      .eq('student_id', input.studentId)
      .eq('is_official', true)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingAttempt) {
      return {
        attempt: existingAttempt,
        deadline: calculateAttemptDeadline(exam, new Date(existingAttempt.started_at), true),
      };
    }
  }

  const startedAt = new Date();
  const attemptPayload: ExamAttemptInsert = {
    exam_id: input.examId,
    student_id: input.studentId,
    roll_number: rollNumber,
    status: 'in_progress',
    started_at: startedAt.toISOString(),
    submitted_at: null,
    total_questions_attempted: 0,
    total_correct: 0,
    total_wrong: 0,
    total_unanswered: 0,
    mcq_marks_obtained: null,
    written_marks_obtained: null,
    total_marks_obtained: null,
    final_rank: null,
    is_official: isOfficial,
  };

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('exam_attempts')
    .insert([attemptPayload])
    .select()
    .single();

  if (attemptError) throw attemptError;

  return {
    attempt,
    deadline: calculateAttemptDeadline(exam, startedAt, isOfficial),
  };
}

export async function getAttemptPayload(attemptId: string, studentId: string) {
  await submitExpiredAttempts(studentId);

  const { data: attempt, error: attemptError } = await supabaseAdmin
    .from('exam_attempts')
    .select('*, exams(*)')
    .eq('id', attemptId)
    .eq('student_id', studentId)
    .single();

  if (attemptError) throw attemptError;

  const typedAttempt = attempt as unknown as AttemptWithExam;
  const exam = typedAttempt.exams;
  const windowState = getExamWindowState(exam);
  const canReview =
    typedAttempt.status !== 'in_progress' &&
    (typedAttempt.is_official
      ? windowState === 'closed' && exam.show_answers_after
      : true);

  const { data: examQuestions, error: questionsError } = await supabaseAdmin
    .from('exam_questions')
    .select('*, questions(*, question_options(*))')
    .eq('exam_id', typedAttempt.exam_id)
    .order('sequence_order', { ascending: true });

  if (questionsError) throw questionsError;

  const { data: answers, error: answersError } = await supabaseAdmin
    .from('answers')
    .select('*')
    .eq('attempt_id', attemptId);

  if (answersError) throw answersError;

  const answersByQuestionId = new Map(
    (answers as AnswerRow[]).map((answer) => [answer.question_id, answer])
  );

  const typedQuestions = examQuestions as unknown as ExamQuestionWithQuestion[];
  const questionPayload = typedQuestions.map((examQuestion) => ({
    id: examQuestion.questions.id,
    exam_question_id: examQuestion.id,
    content: examQuestion.questions.content,
    type: examQuestion.questions.type,
    subject: examQuestion.questions.subject,
    topic: examQuestion.questions.topic,
    explanation: canReview ? examQuestion.questions.explanation : null,
    solution: canReview ? examQuestion.questions.solution : null,
    marks: examQuestion.marks,
    sequence_order: examQuestion.sequence_order,
    selected_option_id: answersByQuestionId.get(examQuestion.question_id)?.selected_option_id ?? null,
    answer_text: answersByQuestionId.get(examQuestion.question_id)?.answer_text ?? null,
    is_correct: canReview ? answersByQuestionId.get(examQuestion.question_id)?.is_correct ?? null : null,
    marked_for_review: answersByQuestionId.get(examQuestion.question_id)?.marked_for_review ?? false,
    options: examQuestion.questions.question_options.map((option) => ({
      id: option.id,
      option_label: option.option_label,
      option_text: option.option_text,
      is_correct: canReview ? option.is_correct : undefined,
    })),
  }));

  if (exam.shuffle_questions && typedAttempt.status === 'in_progress') {
    questionPayload.sort((left, right) => left.id.localeCompare(right.id));
  }

  return {
    attempt: typedAttempt,
    exam,
    window_state: windowState,
    can_review: canReview,
    deadline: calculateAttemptDeadline(
      exam,
      new Date(typedAttempt.started_at),
      typedAttempt.is_official
    ),
    questions: questionPayload,
  };
}

export async function saveAnswer(input: {
  attemptId: string;
  studentId: string;
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  markedForReview?: boolean;
  timeSpentSeconds?: number;
}) {
  const attempt = await assertWritableAttempt(input.attemptId, input.studentId);

  if (new Date() > calculateAttemptDeadline(attempt.exams, new Date(attempt.started_at), attempt.is_official)) {
    await submitAttempt(input.attemptId, input.studentId, { reason: 'deadline_expired' });
    throw new Error('Attempt deadline has passed');
  }

  const answerPayload: AnswerInsert = {
    attempt_id: input.attemptId,
    question_id: input.questionId,
    selected_option_id: input.selectedOptionId ?? null,
    answer_text: input.answerText ?? null,
    is_correct: null,
    marked_for_review: input.markedForReview ?? false,
    answered_at: new Date().toISOString(),
    time_spent_seconds: input.timeSpentSeconds ?? 0,
  };

  const { data, error } = await supabaseAdmin
    .from('answers')
    .upsert([answerPayload], { onConflict: 'attempt_id,question_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleReviewMark(input: {
  attemptId: string;
  studentId: string;
  questionId: string;
  markedForReview: boolean;
}) {
  const attempt = await assertWritableAttempt(input.attemptId, input.studentId);

  if (new Date() > calculateAttemptDeadline(attempt.exams, new Date(attempt.started_at), attempt.is_official)) {
    await submitAttempt(input.attemptId, input.studentId, { reason: 'deadline_expired' });
    throw new Error('Attempt deadline has passed');
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('answers')
    .select('id')
    .eq('attempt_id', input.attemptId)
    .eq('question_id', input.questionId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('answers')
      .update({ marked_for_review: input.markedForReview })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from('answers')
    .insert([{
      attempt_id: input.attemptId,
      question_id: input.questionId,
      selected_option_id: null,
      answer_text: null,
      is_correct: null,
      marked_for_review: input.markedForReview,
      answered_at: new Date().toISOString(),
      time_spent_seconds: 0,
    } satisfies AnswerInsert])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function submitAttempt(
  attemptId: string,
  studentId: string,
  options: { reason?: 'manual' | 'deadline_expired' | 'window_closed' } = {}
) {
  const attempt = await assertWritableAttempt(attemptId, studentId);
  const exam = attempt.exams;

  const { data: examQuestions, error: questionsError } = await supabaseAdmin
    .from('exam_questions')
    .select('*, questions(*, question_options(*))')
    .eq('exam_id', attempt.exam_id);

  if (questionsError) throw questionsError;

  const { data: answers, error: answersError } = await supabaseAdmin
    .from('answers')
    .select('*')
    .eq('attempt_id', attemptId);

  if (answersError) throw answersError;

  const typedQuestions = examQuestions as unknown as ExamQuestionWithQuestion[];
  const answersByQuestionId = new Map(answers.map((answer) => [answer.question_id, answer]));

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let mcqMarks = 0;

  for (const examQuestion of typedQuestions) {
    const answer = answersByQuestionId.get(examQuestion.question_id);
    const correctOption = examQuestion.questions.question_options.find((option) => option.is_correct);

    if (!answer || (!answer.selected_option_id && !answer.answer_text)) {
      unanswered += 1;
      continue;
    }

    const isCorrect =
      !!correctOption && answer.selected_option_id === correctOption.id;

    const answerUpdate: AnswerUpdate = { is_correct: isCorrect };
    await supabaseAdmin.from('answers').update(answerUpdate).eq('id', answer.id);

    if (isCorrect) {
      correct += 1;
      mcqMarks += examQuestion.marks;
    } else {
      wrong += 1;
      mcqMarks -= exam.negative_marking ?? 0;
    }
  }

  const attempted = correct + wrong;
  const finalMarks = Math.max(0, Number(mcqMarks.toFixed(2)));
  const attemptUpdate: ExamAttemptUpdate = {
    status: 'evaluated',
    submitted_at: new Date().toISOString(),
    total_questions_attempted: attempted,
    total_correct: correct,
    total_wrong: wrong,
    total_unanswered: unanswered,
    mcq_marks_obtained: finalMarks,
    total_marks_obtained: finalMarks,
  };

  const { data: submittedAttempt, error: updateError } = await supabaseAdmin
    .from('exam_attempts')
    .update(attemptUpdate)
    .eq('id', attemptId)
    .select()
    .single();

  if (updateError) throw updateError;

  if (attempt.is_official) {
    await rebuildExamLeaderboard(attempt.exam_id);
  }

  await logAuditEvent(studentId, 'exam_attempt_submitted', 'exam_attempts', attemptId, null, {
    examId: attempt.exam_id,
    reason: options.reason ?? 'manual',
    correct,
    wrong,
    unanswered,
    totalMarks: finalMarks,
    official: attempt.is_official,
  });

  return submittedAttempt;
}

export async function rebuildExamLeaderboard(examId: string) {
  const { data: attempts, error } = await supabaseAdmin
    .from('exam_attempts')
    .select('*')
    .eq('exam_id', examId)
    .eq('is_official', true)
    .eq('status', 'evaluated')
    .order('total_marks_obtained', { ascending: false })
    .order('submitted_at', { ascending: true });

  if (error) throw error;

  await supabaseAdmin.from('leaderboards').delete().eq('exam_id', examId);

  const rows: LeaderboardInsert[] = attempts.map((attempt, index) => ({
    exam_id: examId,
    student_id: attempt.student_id,
    rank: index + 1,
    total_marks: attempt.total_marks_obtained ?? 0,
    accuracy_percent:
      attempt.total_questions_attempted > 0
        ? Number(((attempt.total_correct / attempt.total_questions_attempted) * 100).toFixed(2))
        : null,
  }));

  if (rows.length === 0) return [];

  const { data, error: insertError } = await supabaseAdmin
    .from('leaderboards')
    .insert(rows)
    .select();

  if (insertError) throw insertError;
  return data;
}

export async function getExamLeaderboard(examId: string) {
  const { data, error } = await supabaseAdmin
    .from('leaderboards')
    .select('*, users(full_name, student_id)')
    .eq('exam_id', examId)
    .order('rank', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAggregateLeaderboard(input: {
  scope: 'weekly' | 'monthly' | 'batch';
  courseId?: string;
}) {
  const now = new Date();
  const startAt = new Date(now);

  if (input.scope === 'weekly') {
    startAt.setDate(now.getDate() - 7);
  } else if (input.scope === 'monthly') {
    startAt.setMonth(now.getMonth() - 1);
  } else {
    startAt.setFullYear(1970);
  }

  let query = supabaseAdmin
    .from('exam_attempts')
    .select('student_id, total_marks_obtained, total_correct, total_wrong, total_questions_attempted, submitted_at, exams!inner(course_id), users!inner(full_name, student_id)')
    .eq('is_official', true)
    .eq('status', 'evaluated')
    .not('submitted_at', 'is', null)
    .gte('submitted_at', startAt.toISOString());

  if (input.courseId) {
    query = query.eq('exams.course_id', input.courseId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = new Map<
    string,
    {
      student_id: string;
      full_name: string | null;
      platform_student_id: string | null;
      total_marks: number;
      total_correct: number;
      total_wrong: number;
      total_attempted: number;
      attempts: number;
    }
  >();

  const attempts = (data || []) as unknown as AggregateAttemptRow[];

  for (const attempt of attempts) {
    const existing =
      rows.get(attempt.student_id) ??
      {
        student_id: attempt.student_id,
        full_name: attempt.users.full_name,
        platform_student_id: attempt.users.student_id,
        total_marks: 0,
        total_correct: 0,
        total_wrong: 0,
        total_attempted: 0,
        attempts: 0,
      };

    existing.total_marks += Number(attempt.total_marks_obtained ?? 0);
    existing.total_correct += attempt.total_correct ?? 0;
    existing.total_wrong += attempt.total_wrong ?? 0;
    existing.total_attempted += attempt.total_questions_attempted ?? 0;
    existing.attempts += 1;
    rows.set(attempt.student_id, existing);
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      accuracy_percent:
        row.total_attempted > 0
          ? Number(((row.total_correct / row.total_attempted) * 100).toFixed(2))
          : null,
    }))
    .sort((left, right) => {
      if (right.total_marks !== left.total_marks) {
        return right.total_marks - left.total_marks;
      }
      return (right.accuracy_percent ?? 0) - (left.accuracy_percent ?? 0);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function submitExpiredAttempts(studentId?: string) {
  let query = supabaseAdmin
    .from('exam_attempts')
    .select('id, student_id, started_at, is_official, exams!inner(window_end_at, individual_duration_minutes)')
    .eq('status', 'in_progress');

  if (studentId) {
    query = query.eq('student_id', studentId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const now = new Date();
  const submitted = [];

  const attempts = (data || []) as unknown as ExpiringAttemptRow[];

  for (const attempt of attempts) {
    const deadline = calculateAttemptDeadline(
      attempt.exams,
      new Date(attempt.started_at),
      attempt.is_official
    );

    if (now >= deadline) {
      submitted.push(
        await submitAttempt(attempt.id, attempt.student_id, {
          reason: now >= new Date(attempt.exams.window_end_at) ? 'window_closed' : 'deadline_expired',
        })
      );
    }
  }

  return submitted;
}

async function assertWritableAttempt(attemptId: string, studentId: string) {
  const { data, error } = await supabaseAdmin
    .from('exam_attempts')
    .select('*, exams(*)')
    .eq('id', attemptId)
    .eq('student_id', studentId)
    .single();

  if (error) throw error;

  const attempt = data as unknown as AttemptWithExam;
  if (attempt.status !== 'in_progress') {
    throw new Error('Attempt is already submitted');
  }

  return attempt;
}

// ─── Admin Functions ─────────────────────────────────────────────────────────

export async function listExamsAdmin(filters?: {
  scope?: 'course' | 'open';
  courseId?: string;
  examType?: 'mcq' | 'written' | 'combined';
}) {
  let query = supabaseAdmin
    .from('exams')
    .select('*, courses(title, slug)')
    .order('created_at', { ascending: false });

  if (filters?.scope) query = query.eq('scope', filters.scope);
  if (filters?.courseId) query = query.eq('course_id', filters.courseId);
  if (filters?.examType) query = query.eq('exam_type', filters.examType);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((exam) => ({
    ...(exam as any),
    course_title: ((exam as any).courses as any)?.title ?? null,
    window_state: getExamWindowState(exam as any),
  }));
}

export async function getExamAdmin(examId: string) {
  const [examResult, questionsResult, attemptsResult, leaderboardResult] = await Promise.all([
    supabaseAdmin.from('exams').select('*, courses(title, slug)').eq('id', examId).single(),
    supabaseAdmin
      .from('exam_questions')
      .select('*, questions(id, content, subject, topic, difficulty_level, type, question_options(id, option_label, option_text, is_correct))')
      .eq('exam_id', examId)
      .order('sequence_order', { ascending: true }),
    supabaseAdmin
      .from('exam_attempts')
      .select('id, student_id, roll_number, status, started_at, submitted_at, total_questions_attempted, total_correct, total_wrong, total_unanswered, mcq_marks_obtained, written_marks_obtained, total_marks_obtained, final_rank, is_official, created_at, users(full_name, student_id, email)')
      .eq('exam_id', examId)
      .order('created_at', { ascending: false })
      .limit(500),
    supabaseAdmin
      .from('leaderboards')
      .select('*, users(full_name, student_id)')
      .eq('exam_id', examId)
      .order('rank', { ascending: true }),
  ]);

  if (examResult.error) throw examResult.error;

  const exam = examResult.data;
  return {
    exam: {
      ...(exam as any),
      course_title: ((exam as any).courses as any)?.title ?? null,
      window_state: getExamWindowState(exam as any),
    },
    questions: (questionsResult.data ?? []) as unknown as ExamQuestionWithQuestion[],
    attempts: (attemptsResult.data ?? []) as any[],
    leaderboard: (leaderboardResult.data ?? []) as any[],
  };
}

export async function updateExam(
  examId: string,
  input: Partial<Omit<ExamInsert, 'created_by'>>,
  updatedBy: string
) {
  // Enforce negative marking rule: written → always 0
  if (input.exam_type === 'written') {
    input.negative_marking = 0;
  }

  const { data, error } = await supabaseAdmin
    .from('exams')
    .update(input)
    .eq('id', examId)
    .select()
    .single();

  if (error) throw error;
  await logAuditEvent(updatedBy, 'exam_updated', 'exams', examId, null, input as any);
  return data;
}

export async function deleteExam(examId: string, deletedBy: string) {
  const { count, error: countError } = await supabaseAdmin
    .from('exam_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('exam_id', examId);

  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    throw new Error('Cannot delete an exam that already has student attempts.');
  }

  const { error } = await supabaseAdmin.from('exams').delete().eq('id', examId);
  if (error) throw error;
  await logAuditEvent(deletedBy, 'exam_deleted', 'exams', examId, null, {});
}

export async function replaceExamQuestions(
  examId: string,
  questions: Array<{ questionId: string; sequenceOrder: number; marks: number }>
) {
  await supabaseAdmin.from('exam_questions').delete().eq('exam_id', examId);

  if (questions.length === 0) {
    await supabaseAdmin.from('exams').update({ total_questions: 0 }).eq('id', examId);
    return [];
  }

  const rows: ExamQuestionInsert[] = questions.map((q) => ({
    exam_id: examId,
    question_id: q.questionId,
    sequence_order: q.sequenceOrder,
    marks: q.marks,
  }));

  const { data, error } = await supabaseAdmin.from('exam_questions').insert(rows).select();
  if (error) throw error;

  await supabaseAdmin.from('exams').update({ total_questions: questions.length }).eq('id', examId);
  return data;
}
