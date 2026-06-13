import { notFound } from 'next/navigation';

import { CourseEditForm } from '@/components/admin/course-edit-form';
import { requireAdminPage } from '@/lib/auth/server';
import { getCourse, listCourseCategories } from '@/services/course.service';
import { supabaseAdmin } from '@/lib/db/supabase';

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage(['admin', 'teacher', 'super_admin']);

  const { id } = await params;

  const [courseResult, categoriesResult, teachersResult, assignedResult] = await Promise.all([
    getCourse(id),
    listCourseCategories(true),
    supabaseAdmin
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'teacher')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabaseAdmin
      .from('course_instructors')
      .select('teacher_id')
      .eq('course_id', id),
  ]);

  if (!courseResult.success || !courseResult.data) {
    notFound();
  }

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data.map((c) => c.name)
      : [];

  const teachers = (teachersResult.data ?? []) as {
    id: string;
    full_name: string | null;
    email: string | null;
  }[];

  // IDs from junction table; fall back to courses.teacher_id for backward compat
  const assignedIds = assignedResult.data && assignedResult.data.length > 0
    ? assignedResult.data.map((r) => r.teacher_id as string)
    : (courseResult.data as any).teacher_id
      ? [(courseResult.data as any).teacher_id as string]
      : [];

  return (
    <CourseEditForm
      course={courseResult.data as any}
      categories={categories}
      teachers={teachers}
      instructorIds={assignedIds}
    />
  );
}
