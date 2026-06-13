import Link from 'next/link';
import {
  Plus, Globe, Lock, Zap, PenLine, BarChart3,
  Clock, BookOpen, Users, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { requireAdminPage } from '@/lib/auth/server';
import { listExamsAdmin } from '@/services/exam.service';
import { listCourses } from '@/services/course.service';
import { ExamListClient } from '@/components/admin/exam-list-client';

export const metadata = {
  title: 'Exam Management — ProfessorLMS Admin',
  description: 'Create and manage MCQ, Written, and Combined exams',
};

export default async function AdminExamsPage() {
  await requireAdminPage(['admin', 'teacher', 'super_admin', 'mentor']);

  const [exams, courseResult] = await Promise.all([
    listExamsAdmin(),
    listCourses(200, 0, undefined, undefined, true),
  ]);

  const courses = (courseResult.data ?? []).map((c) => ({ id: c.id, title: c.title }));

  const total      = exams.length;
  const live       = exams.filter((e) => e.window_state === 'live').length;
  const upcoming   = exams.filter((e) => e.window_state === 'upcoming').length;
  const closed     = exams.filter((e) => e.window_state === 'closed').length;
  const openScope  = exams.filter((e) => e.scope === 'open').length;
  const drafts     = exams.filter((e) => !e.published_at).length;

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exam Management</h1>
          <p className="mt-1 text-muted-foreground">
            Create MCQ, Written, and Combined exams — course-specific or open to all students.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/admin/exams/new">
            <Plus className="size-4" /> Create Exam
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total',    value: total,     color: 'text-foreground'  },
          { label: 'Live 🔴', value: live,       color: 'text-emerald-400' },
          { label: 'Upcoming', value: upcoming,  color: 'text-blue-400'    },
          { label: 'Closed',   value: closed,    color: 'text-muted-foreground' },
          { label: 'Open',     value: openScope, color: 'text-violet-400'  },
          { label: 'Drafts',   value: drafts,    color: 'text-amber-400'   },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-border/40 bg-card px-4 py-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Client-side list with filtering */}
      <ExamListClient exams={exams} courses={courses} />
    </main>
  );
}
