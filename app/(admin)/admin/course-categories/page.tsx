import { CourseCategoryActions } from '@/components/admin/course-category-actions';
import { CourseCategoryForm } from '@/components/admin/course-category-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdminPage } from '@/lib/auth/server';
import { listCourseCategories } from '@/services/course.service';

import { CourseCategoryTable, CourseCategoryRow } from './course-category-table';

export default async function CourseCategoriesPage() {
  await requireAdminPage(['admin', 'teacher', 'super_admin']);
  const result = await listCourseCategories(true);
  const categories = (result.success && result.data ? result.data : []) as CourseCategoryRow[];
  const usingFallback = 'fallback' in result && result.fallback;

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Course Categories</h1>
        <p className="text-muted-foreground">Create and manage public course categories.</p>
      </div>

      {usingFallback ? (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 text-sm text-amber-900 dark:text-amber-100">
            Supabase has not loaded <span className="font-mono">public.course_categories</span> yet.
            Run the migration and refresh the schema cache. Showing default categories for now.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Add category</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseCategoryForm disabled={usingFallback} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Categories</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {categories.length} configured category{categories.length === 1 ? '' : 'ies'}
              </p>
            </div>
            <Badge variant="secondary">{usingFallback ? 'Fallback' : 'Live DB'}</Badge>
          </CardHeader>
          <CardContent>
            <CourseCategoryTable data={categories} usingFallback={!!usingFallback} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
