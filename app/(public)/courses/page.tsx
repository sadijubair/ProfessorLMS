import Link from 'next/link';
import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { listCourses } from '@/services/course.service';

const categories = ['BCS', 'Bank', 'Admission', 'Academic', 'Skill'];

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const selectedCategory = params.category;
  const query = params.q?.trim();
  const result = await listCourses(48, 0, selectedCategory, query);
  const courses = result.success && result.data ? result.data : [];

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
            <p className="mt-2 text-muted-foreground">
              Browse published batches, free resources, and premium guided programs.
            </p>
          </div>
          <form className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Search courses"
                className="h-10 pl-9"
              />
            </div>
            {selectedCategory ? (
              <input type="hidden" name="category" value={selectedCategory} />
            ) : null}
            <Button type="submit" className="h-10">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6">
        <aside className="space-y-2">
          <Button variant={!selectedCategory ? 'default' : 'outline'} asChild className="w-full justify-start">
            <Link href={query ? `/courses?q=${encodeURIComponent(query)}` : '/courses'}>
              All courses
            </Link>
          </Button>
          {categories.map((category) => {
            const href = `/courses?category=${encodeURIComponent(category)}${
              query ? `&q=${encodeURIComponent(query)}` : ''
            }`;

            return (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                asChild
                className="w-full justify-start"
              >
                <Link href={href}>{category}</Link>
              </Button>
            );
          })}
        </aside>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{courses.length}</span> course
              {courses.length === 1 ? '' : 's'}
            </p>
            {result.success ? null : (
              <p className="text-sm text-destructive">{result.error}</p>
            )}
          </div>

          {courses.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                      <Badge
                        variant={course.pricing_type === 'free' || course.is_free ? 'default' : 'secondary'}
                        className="shrink-0"
                      >
                        {course.pricing_type === 'free' || course.is_free
                          ? 'Free'
                          : `BDT ${course.price_bdt.toLocaleString()}`}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{course.category}</Badge>
                      {course.has_live_exam ? <Badge variant="outline">Live exams</Badge> : null}
                      {course.has_support ? <Badge variant="outline">Support</Badge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {course.short_description || course.description || 'No description added yet.'}
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/courses/${course.slug}`}>View details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No published courses found.
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
