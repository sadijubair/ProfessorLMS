import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAdminPage } from '@/lib/auth/server';
import { getExamAdmin } from '@/services/exam.service';
import { listCourses } from '@/services/course.service';
import { ExamDetail } from '@/components/admin/exam-detail';

type Props = { params: Promise<{ examId: string }> };

export async function generateMetadata({ params }: Props) {
  try {
    const { examId } = await params;
    const { exam } = await getExamAdmin(examId);
    return {
      title: `${exam.title} — ProfessorLMS Admin`,
      description: `Manage exam: ${exam.title}`,
    };
  } catch {
    return { title: 'Exam — ProfessorLMS Admin' };
  }
}

export default async function AdminExamDetailPage({ params }: Props) {
  await requireAdminPage(['admin', 'teacher', 'super_admin', 'mentor']);

  const { examId } = await params;

  let examData;
  try {
    examData = await getExamAdmin(examId);
  } catch {
    notFound();
  }

  const courseResult = await listCourses(200, 0, undefined, undefined, true);
  const courses = (courseResult.data ?? []).map((c) => ({ id: c.id, title: c.title }));

  const { exam, questions, attempts, leaderboard } = examData;

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/admin/exams">
            <ChevronLeft className="size-4" /> Exams
          </Link>
        </Button>
      </div>

      <ExamDetail
        initialExam={exam as any}
        initialQuestions={questions as any}
        initialAttempts={attempts as any}
        initialLeaderboard={leaderboard as any}
        courses={courses}
      />
    </main>
  );
}
