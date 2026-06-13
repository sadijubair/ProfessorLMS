import { supabaseAdmin } from '@/lib/db/supabase';

type ExamAttemptRow = {
  id: string;
  exam_id: string;
  student_id: string;
  total_questions_attempted: number;
  total_correct: number;
  total_wrong: number;
  total_marks_obtained: number | null;
  submitted_at: string | null;
  exams: {
    course_id: string;
    title: string;
    total_marks: number;
  };
};

type PracticeAttemptRow = {
  id: string;
  course_id: string;
  question_id: string;
  is_correct: boolean | null;
  attempted_at: string;
  questions: {
    subject: string | null;
    topic: string | null;
    difficulty_level: string;
  };
};

export async function getStudentAnalytics(studentId: string) {
  const { data: examAttemptsData, error: examError } = await supabaseAdmin
    .from('exam_attempts')
    .select('id, exam_id, student_id, total_questions_attempted, total_correct, total_wrong, total_marks_obtained, submitted_at, exams!inner(course_id, title, total_marks)')
    .eq('student_id', studentId)
    .eq('status', 'evaluated')
    .order('submitted_at', { ascending: true });

  if (examError) throw examError;

  const { data: practiceAttemptsData, error: practiceError } = await supabaseAdmin
    .from('question_practice_attempts')
    .select('id, course_id, question_id, is_correct, attempted_at, questions!inner(subject, topic, difficulty_level)')
    .eq('student_id', studentId)
    .order('attempted_at', { ascending: true });

  if (practiceError) throw practiceError;

  const examAttempts = (examAttemptsData || []) as unknown as ExamAttemptRow[];
  const practiceAttempts = (practiceAttemptsData || []) as unknown as PracticeAttemptRow[];

  const totalExamAttempts = examAttempts.length;
  const totalPracticeAttempts = practiceAttempts.length;
  const examCorrect = examAttempts.reduce((sum, attempt) => sum + attempt.total_correct, 0);
  const examWrong = examAttempts.reduce((sum, attempt) => sum + attempt.total_wrong, 0);
  const examAnswered = examAttempts.reduce(
    (sum, attempt) => sum + attempt.total_questions_attempted,
    0
  );
  const practiceCorrect = practiceAttempts.filter((attempt) => attempt.is_correct).length;
  const practiceAnswered = practiceAttempts.length;
  const answered = examAnswered + practiceAnswered;
  const correct = examCorrect + practiceCorrect;
  const wrong = examWrong + (practiceAnswered - practiceCorrect);
  const accuracy = answered ? Number(((correct / answered) * 100).toFixed(2)) : 0;
  const averageMarks = totalExamAttempts
    ? Number(
        (
          examAttempts.reduce((sum, attempt) => sum + Number(attempt.total_marks_obtained ?? 0), 0) /
          totalExamAttempts
        ).toFixed(2)
      )
    : 0;

  const subjectPerformance = summarizePracticeBy(practiceAttempts, 'subject');
  const topicPerformance = summarizePracticeBy(practiceAttempts, 'topic');
  const weakAreas = [...topicPerformance]
    .filter((item) => item.attempts >= 2)
    .sort((left, right) => left.accuracy - right.accuracy)
    .slice(0, 5);

  const rankTrend = examAttempts.map((attempt, index) => ({
    label: attempt.exams.title,
    attempt: index + 1,
    marks: Number(attempt.total_marks_obtained ?? 0),
    totalMarks: attempt.exams.total_marks,
    accuracy:
      attempt.total_questions_attempted > 0
        ? Number(((attempt.total_correct / attempt.total_questions_attempted) * 100).toFixed(2))
        : 0,
  }));

  return {
    summary: {
      totalExamAttempts,
      totalPracticeAttempts,
      answered,
      correct,
      wrong,
      accuracy,
      averageMarks,
      streak: calculateStreak([
        ...examAttempts.map((attempt) => attempt.submitted_at),
        ...practiceAttempts.map((attempt) => attempt.attempted_at),
      ]),
    },
    subjectPerformance,
    topicPerformance,
    weakAreas,
    rankTrend,
  };
}

function summarizePracticeBy(
  attempts: PracticeAttemptRow[],
  key: 'subject' | 'topic'
) {
  const map = new Map<string, { label: string; attempts: number; correct: number; accuracy: number }>();

  for (const attempt of attempts) {
    const label = attempt.questions[key] || 'Uncategorized';
    const current = map.get(label) || { label, attempts: 0, correct: 0, accuracy: 0 };
    current.attempts += 1;
    current.correct += attempt.is_correct ? 1 : 0;
    current.accuracy = Number(((current.correct / current.attempts) * 100).toFixed(2));
    map.set(label, current);
  }

  return [...map.values()].sort((left, right) => right.attempts - left.attempts);
}

function calculateStreak(dates: Array<string | null>) {
  const uniqueDays = new Set(
    dates
      .filter(Boolean)
      .map((date) => new Date(date as string).toISOString().slice(0, 10))
  );

  let streak = 0;
  const cursor = new Date();

  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
