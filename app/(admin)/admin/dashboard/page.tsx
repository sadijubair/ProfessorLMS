import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAdminPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export default async function AdminDashboard() {
  await requireAdminPage();

  const [
    { count: userCount },
    { count: courseCount },
    { data: pendingPayments },
    { data: approvedPayments },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('courses').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('payments').select('id, amount_bdt').eq('status', 'pending'),
    supabaseAdmin.from('payments').select('amount_bdt').eq('status', 'approved'),
    supabaseAdmin
      .from('course_enrollments')
      .select('id, enrollment_status, payment_status, enrolled_at')
      .order('enrolled_at', { ascending: false })
      .limit(5),
  ]);

  const revenue = (approvedPayments || []).reduce(
    (sum, payment) => sum + payment.amount_bdt,
    0
  );
  const pendingAmount = (pendingPayments || []).reduce(
    (sum, payment) => sum + payment.amount_bdt,
    0
  );

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Foundation and revenue operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
            <p className="mt-2 text-2xl font-bold">{userCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
            <p className="mt-2 text-2xl font-bold">{courseCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Approved Revenue</p>
            <p className="mt-2 text-2xl font-bold">BDT {revenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
            <p className="mt-2 text-2xl font-bold">{pendingPayments?.length || 0}</p>
            <p className="text-xs text-muted-foreground">BDT {pendingAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentEnrollments || []).map((enrollment) => (
              <div key={enrollment.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{enrollment.enrollment_status}</p>
                <p className="text-muted-foreground">
                  Payment {enrollment.payment_status} /{' '}
                  {new Date(enrollment.enrolled_at).toLocaleString()}
                </p>
              </div>
            ))}
            {!recentEnrollments?.length ? (
              <p className="text-sm text-muted-foreground">No recent enrollments</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button asChild className="justify-start">
              <Link href="/admin/payments">Approve pending payments</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/courses/create">Create new course</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/commerce">Open commerce console</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/admin/audit-logs">View audit logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
