import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Clock, Users } from 'lucide-react';

import EnrollButton from '@/components/enroll-button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCourseBySlug } from '@/services/course.service';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCourseBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const course = result.data;
  const isFree = course.pricing_type === 'free' || course.is_free;
  const pricingLabel = isFree ? 'Free' : `BDT ${course.price_bdt.toLocaleString()}`;
  const description = course.short_description || course.description;
  const features = [
    ['Self-paced lessons', course.is_self_paced],
    ['Teacher/support assistance', course.has_support],
    ['Facebook community', course.has_facebook_group],
    ['Google Classroom access', course.has_google_classroom],
    ['Live exams', course.has_live_exam],
    ['Written evaluation', course.has_written_exam],
  ] as const;

  const curriculum = course.curriculum_sections || [];

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <Button variant="ghost" asChild className="mb-4 px-0">
            <Link href="/courses">Back to courses</Link>
          </Button>
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge>{course.category}</Badge>
                <Badge variant={isFree ? 'default' : 'secondary'}>
                  {pricingLabel}
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                {course.title}
              </h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                {description || 'Course details will be updated soon.'}
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {pricingLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EnrollButton
                  courseId={course.id}
                  isFree={isFree}
                  priceBdt={course.price_bdt}
                />
                {course.requires_manual_payment && !isFree ? (
                  <p className="rounded-lg border bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    Manual bKash/Nagad/Rocket/Bank payment verification is required after enrollment.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What this course includes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {features.map(([label, enabled]) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <CheckCircle2
                    className={enabled ? 'h-5 w-5 text-emerald-600' : 'h-5 w-5 text-muted-foreground/40'}
                  />
                  <span className={enabled ? 'font-medium' : 'text-muted-foreground'}>
                    {label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              {curriculum.length ? (
                <Accordion type="multiple" className="space-y-2">
                  {curriculum.map((section, index) => (
                    <AccordionItem key={`${section.title}-${index}`} value={`section-${index}`}>
                      <AccordionTrigger className="px-0 text-base font-semibold">
                        {section.title}
                      </AccordionTrigger>
                      <AccordionContent className="px-0">
                        <ul className="space-y-2 pl-5 text-sm text-muted-foreground">
                          {section.items.length ? (
                            section.items.map((item) => (
                              <li key={item} className="list-disc">
                                {item}
                              </li>
                            ))
                          ) : (
                            <li className="list-disc">Curriculum items will be updated soon.</li>
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">Curriculum will be published soon.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollment flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Free courses activate instantly with a roll number and community token.</p>
              <p>
                Paid courses create a pending enrollment first. Submit your payment details,
                then support staff verifies and activates your access.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Course facts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duration
              </span>
              <span className="font-medium">
                {course.duration_days ? `${course.duration_days} days` : 'Self-paced'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Seats
              </span>
              <span className="font-medium">
                {course.max_students ? course.max_students.toLocaleString() : 'Open'}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
