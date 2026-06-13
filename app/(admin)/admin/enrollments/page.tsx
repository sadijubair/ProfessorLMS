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

type EnrollmentRow = {
  id: string;
  roll_number: string | null;
  enrollment_status: string;
  payment_status: string;
  community_token: string | null;
  enrolled_at: string;
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

export default async function AdminEnrollmentsPage() {
  await requireAdminPage(['admin', 'support', 'super_admin']);

  const { data } = (await supabaseAdmin
    .from('course_enrollments')
    .select(
      'id, roll_number, enrollment_status, payment_status, community_token, enrolled_at, users!inner(full_name, email, mobile, student_id), courses!inner(title)'
    )
    .order('enrolled_at', { ascending: false })) as unknown as {
    data: EnrollmentRow[] | null;
  };

  const enrollments = data || [];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enrollments</h1>
        <p className="text-muted-foreground">Review student course access, rolls, and community tokens.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Enrollment</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead>Community token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="font-medium">{enrollment.users.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-muted-foreground">
                      {enrollment.users.student_id || enrollment.users.email || enrollment.users.mobile}
                    </div>
                  </TableCell>
                  <TableCell>{enrollment.courses.title}</TableCell>
                  <TableCell>
                    <Badge>{enrollment.enrollment_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{enrollment.payment_status}</Badge>
                  </TableCell>
                  <TableCell>{enrollment.roll_number || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{enrollment.community_token || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
