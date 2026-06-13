import { redirect } from 'next/navigation';

import { PaymentSubmitForm } from '@/components/student/payment-submit-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireStudentPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

type EnrollmentWithCourse = {
  id: string;
  student_id: string;
  payment_status: string;
  courses: {
    title: string;
    price_bdt: number;
    is_free: boolean;
  };
};

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollmentId?: string }>;
}) {
  const { session } = await requireStudentPage();
  const { enrollmentId } = await searchParams;

  if (!enrollmentId) {
    redirect('/dashboard/payments');
  }

  const { data } = (await supabaseAdmin
    .from('course_enrollments')
    .select('id, student_id, payment_status, courses!inner(title, price_bdt, is_free)')
    .eq('id', enrollmentId)
    .eq('student_id', session.userId)
    .maybeSingle()) as unknown as { data: EnrollmentWithCourse | null };

  if (!data || data.courses.is_free) {
    redirect('/dashboard/payments');
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <p className="font-medium">{data.courses.title}</p>
            <p className="mt-1 text-muted-foreground">
              Amount due: BDT {data.courses.price_bdt.toLocaleString()}
            </p>
          </div>
          <PaymentSubmitForm
            enrollmentId={data.id}
            amountBdt={data.courses.price_bdt}
          />
        </CardContent>
      </Card>
    </main>
  );
}
