import { supabaseAdmin } from '@/lib/db/supabase';
import type { Database } from '@/lib/db/types';
import { logAuditEvent } from '@/services/auth.service';

type Tables = Database['public']['Tables'];
type QuestionInsert = Tables['questions']['Insert'];
type QuestionOptionInsert = Tables['question_options']['Insert'];
type PracticeMode = Tables['question_practice_attempts']['Row']['practice_mode'];

export type QuestionInput = {
  courseId: string;
  type?: 'mcq' | 'written' | 'short_answer';
  content: string;
  explanation?: string | null;
  solution?: string | null;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  subject?: string | null;
  topic?: string | null;
  examYear?: number | null;
  options?: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
};

type QuestionWithOptions = Tables['questions']['Row'] & {
  question_options: Tables['question_options']['Row'][];
};

export async function createQuestion(input: QuestionInput, createdBy: string) {
  const questionPayload: QuestionInsert = {
    course_id: input.courseId,
    type: input.type ?? 'mcq',
    content: input.content,
    explanation: input.explanation ?? null,
    solution: input.solution ?? null,
    difficulty_level: input.difficultyLevel,
    subject: input.subject ?? '',
    topic: input.topic ?? '',
    exam_year: input.examYear ?? null,
    created_by: createdBy,
  };

  const { data: question, error } = await supabaseAdmin
    .from('questions')
    .insert([questionPayload])
    .select()
    .single();

  if (error) throw error;

  if (input.type !== 'written' && input.options?.length) {
    await insertOptions(question.id, input.options);
  }

  await logAuditEvent(createdBy, 'question_created', 'questions', question.id, null, {
    courseId: input.courseId,
    subject: input.subject ?? null,
    topic: input.topic ?? null,
  });

  return question;
}

export async function bulkImportQuestions(rows: QuestionInput[], createdBy: string) {
  const created = [];

  for (const row of rows) {
    created.push(await createQuestion(row, createdBy));
  }

  await logAuditEvent(createdBy, 'questions_bulk_imported', 'questions', null, null, {
    count: created.length,
  });

  return created;
}

export async function listQuestions(filters: {
  courseId?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  examYear?: number;
  limit?: number;
}) {
  let query = supabaseAdmin
    .from('questions')
    .select('*, question_options(*)')
    .order('created_at', { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.courseId) query = query.eq('course_id', filters.courseId);
  if (filters.subject) query = query.ilike('subject', `%${filters.subject}%`);
  if (filters.topic) query = query.ilike('topic', `%${filters.topic}%`);
  if (filters.difficulty) {
    query = query.eq('difficulty_level', filters.difficulty as 'easy' | 'medium' | 'hard');
  }
  if (filters.examYear) query = query.eq('exam_year', filters.examYear);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as unknown as QuestionWithOptions[];
}

export async function getPracticeQuestions(input: {
  studentId: string;
  mode: PracticeMode;
  courseId?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  examYear?: number;
  limit?: number;
}) {
  const { data: enrollments, error: enrollmentError } = await supabaseAdmin
    .from('course_enrollments')
    .select('course_id')
    .eq('student_id', input.studentId)
    .eq('enrollment_status', 'active');

  if (enrollmentError) throw enrollmentError;

  const courseIds = (enrollments || []).map((enrollment) => enrollment.course_id);
  if (!courseIds.length) return [];

  let allowedCourseIds = courseIds;
  if (input.courseId && courseIds.includes(input.courseId)) {
    allowedCourseIds = [input.courseId];
  }

  let query = supabaseAdmin
    .from('questions')
    .select('*, question_options(id, option_label, option_text)')
    .eq('type', 'mcq')
    .in('course_id', allowedCourseIds)
    .limit(input.limit ?? 20);

  if (input.subject) query = query.ilike('subject', `%${input.subject}%`);
  if (input.topic) query = query.ilike('topic', `%${input.topic}%`);
  if (input.difficulty) {
    query = query.eq('difficulty_level', input.difficulty as 'easy' | 'medium' | 'hard');
  }
  if (input.examYear) query = query.eq('exam_year', input.examYear);

  if (input.mode === 'random') {
    query = query.order('created_at', { ascending: false });
  } else if (input.mode === 'previous_year') {
    query = query.not('exam_year', 'is', null).order('exam_year', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []) as unknown as QuestionWithOptions[];
}

export async function submitPracticeAnswer(input: {
  studentId: string;
  questionId: string;
  selectedOptionId: string;
  practiceMode: PracticeMode;
  timeSpentSeconds?: number;
}) {
  const { data: question, error: questionError } = await supabaseAdmin
    .from('questions')
    .select('id, course_id, question_options(id, is_correct)')
    .eq('id', input.questionId)
    .single();

  if (questionError) throw questionError;

  const typedQuestion = question as unknown as {
    id: string;
    course_id: string;
    question_options: Array<{ id: string; is_correct: boolean }>;
  };

  const { data: enrollment, error: enrollmentError } = await supabaseAdmin
    .from('course_enrollments')
    .select('id')
    .eq('student_id', input.studentId)
    .eq('course_id', typedQuestion.course_id)
    .eq('enrollment_status', 'active')
    .maybeSingle();

  if (enrollmentError) throw enrollmentError;
  if (!enrollment) throw new Error('Active enrollment required');

  const selectedOption = typedQuestion.question_options.find(
    (option) => option.id === input.selectedOptionId
  );
  if (!selectedOption) throw new Error('Invalid option');

  const { data, error } = await supabaseAdmin
    .from('question_practice_attempts')
    .insert([
      {
        student_id: input.studentId,
        course_id: typedQuestion.course_id,
        question_id: input.questionId,
        selected_option_id: input.selectedOptionId,
        is_correct: selectedOption.is_correct,
        practice_mode: input.practiceMode,
        time_spent_seconds: input.timeSpentSeconds ?? 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function parseQuestionCsv(csv: string, fallbackCourseId?: string): QuestionInput[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const correct = String(row.correct_option || row.correct || 'A').trim().toUpperCase();

    return {
      courseId: row.course_id || fallbackCourseId || '',
      type: 'mcq',
      content: row.content,
      explanation: row.explanation || null,
      solution: row.solution || null,
      difficultyLevel: (row.difficulty_level || 'medium') as QuestionInput['difficultyLevel'],
      subject: row.subject || null,
      topic: row.topic || null,
      examYear: row.exam_year ? Number(row.exam_year) : null,
      options: ['A', 'B', 'C', 'D']
        .map((label) => ({
          label,
          text: row[`option_${label.toLowerCase()}`],
          isCorrect: correct === label,
        }))
        .filter((option) => option.text),
    };
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value.trim());
  return values.map((item) => item.replace(/^"|"$/g, ''));
}

async function insertOptions(
  questionId: string,
  options: NonNullable<QuestionInput['options']>
) {
  const rows: QuestionOptionInsert[] = options.map((option) => ({
    question_id: questionId,
    option_label: option.label,
    option_text: option.text,
    is_correct: option.isCorrect,
  }));

  const { error } = await supabaseAdmin.from('question_options').insert(rows);
  if (error) throw error;
}
