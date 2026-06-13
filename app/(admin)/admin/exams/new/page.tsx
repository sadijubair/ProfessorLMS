import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAdminPage } from '@/lib/auth/server';
import { listCourses } from '@/services/course.service';
import { ExamCreateForm } from '@/components/admin/exam-create-form';

export const metadata = {
  title: 'Create Exam — ProfessorLMS Admin',
  description: 'Create a new MCQ, Written, or Combined exam',
};

export default async function AdminExamNewPage() {
  await requireAdminPage(['admin', 'teacher', 'super_admin']);

  const courseResult = await listCourses(200, 0, undefined, undefined, true);
  const courses = (courseResult.data ?? []).map((c) => ({ id: c.id, title: c.title }));

  return (
    <main className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link href="/admin/exams">
            <ChevronLeft className="size-4" /> Exams
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Exam</h1>
          <p className="text-sm text-muted-foreground">Configure your exam step-by-step across the tabs below.</p>
        </div>
      </div>

      <ExamCreateForm courses={courses} />
    </main>
  );
}
