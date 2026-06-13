import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireStudentPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

type Enrollment = {
  id: string;
  payment_status: 'unpaid' | 'pending' | 'approved' | 'rejected';
  enrollment_status: string;
  roll_number: string | null;
  courses: {
    title: string;
    price_bdt: number;
    is_free: boolean;
  };
  payments: {
    id: string;
    transaction_id: string;
    amount_bdt: number;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    submitted_at: string;
  }[];
};

export default async function StudentPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { session } = await requireStudentPage();
  const params = await searchParams;

  const { data } = (await supabaseAdmin
    .from('course_enrollments')
    .select(
      'id, payment_status, enrollment_status, roll_number, courses!inner(title, price_bdt, is_free), payments(id, transaction_id, amount_bdt, status, rejection_reason, submitted_at)'
    )
    .eq('student_id', session.userId)
    .order('enrolled_at', { ascending: false })) as unknown as {
    data: Enrollment[] | null;
  };

  const enrollments = data || [];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Track payment submissions and enrollment activation.
        </p>
      </div>

      {params.submitted ? (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-4 text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Payment submitted. Support will verify it shortly.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Enrollment payments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => {
                const latestPayment = enrollment.payments?.[0];
                const needsPayment =
                  !enrollment.courses.is_free &&
                  ['unpaid', 'rejected'].includes(enrollment.payment_status);

                return (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.courses.title}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.payment_status === 'approved' ? 'default' : 'secondary'}>
                        {enrollment.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>BDT {enrollment.courses.price_bdt.toLocaleString()}</TableCell>
                    <TableCell>{latestPayment?.transaction_id || '-'}</TableCell>
                    <TableCell>{enrollment.roll_number || '-'}</TableCell>
                    <TableCell className="text-right">
                      {needsPayment ? (
                        <Button asChild size="sm">
                          <Link href={`/checkout?enrollmentId=${enrollment.id}`}>
                            Submit payment
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">No action</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!enrollments.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No enrollments yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
