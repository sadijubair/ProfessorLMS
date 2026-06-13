import { PaymentActions } from '@/components/admin/payment-actions';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAdminPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

type PaymentRow = {
  id: string;
  amount_bdt: number;
  payment_method: string;
  transaction_id: string;
  sender_mobile: string;
  screenshot_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  course_enrollments: {
    id: string;
    users: {
      full_name: string | null;
      email: string | null;
      mobile: string | null;
      student_id: string | null;
    };
    courses: {
      title: string;
    };
  };
};

export default async function AdminPaymentsPage() {
  await requireAdminPage(['admin', 'support', 'super_admin']);

  const { data } = (await supabaseAdmin
    .from('payments')
    .select(
      'id, amount_bdt, payment_method, transaction_id, sender_mobile, screenshot_url, status, submitted_at, course_enrollments!inner(id, users!inner(full_name, email, mobile, student_id), courses!inner(title))'
    )
    .order('submitted_at', { ascending: false })) as unknown as {
    data: PaymentRow[] | null;
  };

  const payments = data || [];
  const pendingCount = payments.filter((payment) => payment.status === 'pending').length;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Queue</h1>
        <p className="text-muted-foreground">
          Verify manual bKash, Nagad, Rocket, and bank transfer submissions.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total submissions</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Pending amount</p>
            <p className="text-2xl font-bold">
              BDT{' '}
              {payments
                .filter((payment) => payment.status === 'pending')
                .reduce((sum, payment) => sum + payment.amount_bdt, 0)
                .toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Txn</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Screenshot</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">
                      {payment.course_enrollments.users.full_name || 'Unnamed'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payment.course_enrollments.users.student_id || payment.course_enrollments.users.mobile}
                    </div>
                  </TableCell>
                  <TableCell>{payment.course_enrollments.courses.title}</TableCell>
                  <TableCell>
                    <div className="font-medium">{payment.transaction_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {payment.payment_method} / {payment.sender_mobile}
                    </div>
                  </TableCell>
                  <TableCell>BDT {payment.amount_bdt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'approved' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.screenshot_url ? (
                      <a className="text-primary underline" href={payment.screenshot_url} target="_blank">
                        View
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {payment.status === 'pending' ? (
                      <PaymentActions paymentId={payment.id} />
                    ) : (
                      <span className="text-sm text-muted-foreground">Completed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
