import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';

import { CourseCreateForm } from '@/components/admin/course-create-form';
import { requireAdminPage } from '@/lib/auth/server';
import { listCourseCategories } from '@/services/course.service';

export default async function CreateCoursePage() {
  await requireAdminPage(['admin', 'teacher', 'super_admin']);

  const categoriesResult = await listCourseCategories();
  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data.map((c) => c.name)
      : [];

  return (
    <main className="min-h-screen">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link
                href="/admin/courses"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" /> Courses
              </Link>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">New Course</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">Create New Course</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up course details, pricing, features, and curriculum.
            </p>
          </div>
        </div>
      </div>

      <CourseCreateForm categories={categories} />
    </main>
  );
}
