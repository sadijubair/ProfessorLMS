import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { requireAdminPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import {
  GraduationCap, Mail, Phone, Calendar, BookOpen, MoreHorizontal,
} from 'lucide-react';

type StudentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  student_id: string | null;
  created_at: string;
  is_active: boolean | null;
  _count?: { enrollments: number };
};

function Avatar({ name, email }: { name?: string | null; email?: string | null }) {
  const letter = (name ?? email ?? '?')[0].toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-600 dark:text-emerald-400">
      {letter}
    </div>
  );
}

export default async function AdminStudentsPage() {
  await requireAdminPage(['admin', 'super_admin', 'support']);

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, mobile, student_id, created_at, is_active')
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(500) as { data: StudentRow[] | null };

  const students = data ?? [];

  // Enrollment counts
  const { data: enrollData } = await supabaseAdmin
    .from('course_enrollments')
    .select('user_id') as { data: { user_id: string }[] | null };

  const enrollMap: Record<string, number> = {};
  (enrollData ?? []).forEach(e => {
    enrollMap[e.user_id] = (enrollMap[e.user_id] ?? 0) + 1;
  });

  const activeCount = students.filter(s => s.is_active !== false).length;

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          </div>
          <p className="text-muted-foreground">
            All registered students with enrollment overview.
          </p>
        </div>
        <AddUserDialog role="student" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Students', value: students.length, color: 'text-primary' },
          { label: 'Active', value: activeCount, color: 'text-emerald-600' },
          { label: 'Inactive', value: students.length - activeCount, color: 'text-zinc-400' },
          { label: 'Total Enrollments', value: Object.values(enrollMap).reduce((a, b) => a + b, 0), color: 'text-amber-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>Showing {students.length} students</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <GraduationCap className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm">No students registered yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Enrolled In</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={student.full_name} email={student.email} />
                        <div>
                          <p className="font-medium">{student.full_name ?? '—'}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{student.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.student_id ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm">
                        {student.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground/60" />{student.email}</span>}
                        {student.mobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground/60" />{student.mobile}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                        {enrollMap[student.id] ?? 0} course{(enrollMap[student.id] ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        student.is_active !== false
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${student.is_active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        {student.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
