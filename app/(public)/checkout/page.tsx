import { redirect } from 'next/navigation';

import { PaymentSubmitForm } from '@/components/student/payment-submit-form';
import { Badge } from '@/components/ui/badge';
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

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ enrollmentId?: string }>;
}) {
  const { session } = await requireStudentPage();
  const { enrollmentId } = await searchParams;

  if (!enrollmentId) {
    redirect('/courses');
  }

  const { data } = (await supabaseAdmin
    .from('course_enrollments')
    .select('id, student_id, payment_status, courses!inner(title, price_bdt, is_free)')
    .eq('id', enrollmentId)
    .eq('student_id', session.userId)
    .maybeSingle()) as unknown as { data: EnrollmentWithCourse | null };

  if (!data) {
    redirect('/courses');
  }

  if (data.courses.is_free || data.payment_status === 'approved') {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 md:py-12">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-4">
          <Badge variant="secondary">Secure manual checkout</Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              Complete your enrollment
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Submit your payment details for verification. Your course access will activate
              after the admin team approves the transaction.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{data.courses.title}</p>
                  <p className="text-muted-foreground">Course enrollment</p>
                </div>
                <p className="font-semibold">BDT {data.courses.price_bdt.toLocaleString()}</p>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>BDT {data.courses.price_bdt.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Payment details</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentSubmitForm
              enrollmentId={data.id}
              amountBdt={data.courses.price_bdt}
              redirectTo="/dashboard?paymentSubmitted=1"
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
