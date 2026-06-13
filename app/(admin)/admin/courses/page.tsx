import Link from 'next/link';
import { Plus } from 'lucide-react';

import { CoursesGrid } from '@/components/admin/courses-grid';
import { Button } from '@/components/ui/button';
import { requireAdminPage } from '@/lib/auth/server';
import { listCourses, listCourseCategories } from '@/services/course.service';

export default async function ManageCoursesPage() {
  await requireAdminPage(['admin', 'teacher', 'super_admin']);

  const [coursesResult, categoriesResult] = await Promise.all([
    listCourses(500, 0, undefined, undefined, true),
    listCourseCategories(true),
  ]);

  const courses = coursesResult.success && coursesResult.data ? coursesResult.data : [];
  const categories =
    categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];

  return (
    <main className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Manage Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, publish, and configure all courses on the platform.
          </p>
        </div>
        <Button asChild className="shrink-0 gap-1.5">
          <Link href="/admin/courses/create">
            <Plus className="h-4 w-4" />
            Add New Course
          </Link>
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Total Courses',
            value: courses.length,
            color: 'text-foreground',
          },
          {
            label: 'Published',
            value: courses.filter((c) => Boolean(c.published_at)).length,
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Drafts',
            value: courses.filter(
              (c) => !c.published_at && (!c.course_status || c.course_status === 'draft'),
            ).length,
            color: 'text-zinc-500',
          },
          {
            label: 'Free Courses',
            value: courses.filter((c) => c.is_free || c.pricing_type === 'free').length,
            color: 'text-primary',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card px-4 py-3 shadow-sm"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={`mt-0.5 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Courses grid with filtering */}
      <CoursesGrid courses={courses} categories={categories} />
    </main>
  );
}
