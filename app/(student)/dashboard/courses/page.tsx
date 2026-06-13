import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock, CreditCard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireStudentPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

type StudentCourse = {
  id: string;
  enrollment_status: 'pending' | 'active' | 'completed' | 'dropped';
  payment_status: 'unpaid' | 'pending' | 'approved' | 'rejected';
  roll_number: string | null;
  activated_at: string | null;
  enrolled_at: string;
  courses: {
    title: string;
    slug: string;
    description: string | null;
    price_bdt: number;
    is_free: boolean;
    duration_days: number | null;
  };
};

function getStatusLabel(enrollment: StudentCourse) {
  if (enrollment.enrollment_status === 'active') {
    return 'Active';
  }

  if (enrollment.payment_status === 'pending') {
    return 'Payment review';
  }

  if (enrollment.payment_status === 'rejected') {
    return 'Payment rejected';
  }

  return 'Payment required';
}

export default async function StudentCoursesPage() {
  const { session } = await requireStudentPage();

  const { data } = (await supabaseAdmin
    .from('course_enrollments')
    .select(
      'id, enrollment_status, payment_status, roll_number, activated_at, enrolled_at, courses!inner(title, slug, description, price_bdt, is_free, duration_days)'
    )
    .eq('student_id', session.userId)
    .order('enrolled_at', { ascending: false })) as unknown as {
    data: StudentCourse[] | null;
  };

  const enrollments = data || [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground">
            Courses you enrolled in or purchased are listed here.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/courses">Browse more courses</Link>
        </Button>
      </div>

      {enrollments.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((enrollment) => {
            const isActive = enrollment.enrollment_status === 'active';
            const needsPayment = ['unpaid', 'rejected'].includes(enrollment.payment_status);

            return (
              <Card key={enrollment.id} className="flex flex-col">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                      {getStatusLabel(enrollment)}
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg">
                    {enrollment.courses.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {enrollment.courses.description || 'Course details will be updated soon.'}
                  </p>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        Payment
                      </span>
                      <span className="font-medium capitalize">{enrollment.payment_status}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4" />
                        Roll
                      </span>
                      <span className="font-medium">{enrollment.roll_number || 'Pending'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Duration
                      </span>
                      <span className="font-medium">
                        {enrollment.courses.duration_days
                          ? `${enrollment.courses.duration_days} days`
                          : 'Self-paced'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-2 pt-2">
                    {isActive ? (
                      <Button asChild className="flex-1">
                        <Link href={`/courses/${enrollment.courses.slug}`}>Open course</Link>
                      </Button>
                    ) : needsPayment ? (
                      <Button asChild className="flex-1">
                        <Link href={`/checkout?enrollmentId=${enrollment.id}`}>Complete payment</Link>
                      </Button>
                    ) : (
                      <Button className="flex-1" disabled>
                        Awaiting approval
                      </Button>
                    )}
                    <Button asChild variant="outline">
                      <Link href="/dashboard/payments">Payments</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
              <BookOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">No courses yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enroll in a course and it will appear in your student dashboard.
              </p>
            </div>
            <Button asChild>
              <Link href="/courses">Browse courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
