import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { requireAdminPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import {
  HeadphonesIcon, Mail, Phone, Calendar, MoreHorizontal, MessageCircle, UserPlus,
} from 'lucide-react';

type SupportRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  student_id: string | null;
  created_at: string;
  is_active: boolean | null;
};

export default async function AdminSupportStaffPage() {
  await requireAdminPage(['admin', 'super_admin']);

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, mobile, student_id, created_at, is_active')
    .eq('role', 'support')
    .order('created_at', { ascending: false }) as { data: SupportRow[] | null };

  const staff = data ?? [];
  const activeCount = staff.filter(s => s.is_active !== false).length;

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <HeadphonesIcon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Support Staff</h1>
          </div>
          <p className="text-muted-foreground">
            Support agents who handle student queries, tickets, and community management.
          </p>
        </div>
        <AddUserDialog role="support" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Staff', value: staff.length, color: 'text-primary' },
          { label: 'Active', value: activeCount, color: 'text-emerald-600' },
          { label: 'Inactive', value: staff.length - activeCount, color: 'text-zinc-400' },
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
          <CardTitle>Support Staff Directory</CardTitle>
          <CardDescription>{staff.length} support agents</CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm font-medium">No support staff added yet.</p>
              <p className="mt-1 text-xs">Add support agents to help manage student queries.</p>
              <Button className="mt-4 gap-2" size="sm">
                <UserPlus className="h-3.5 w-3.5" /> Add Support Staff
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                          {(member.full_name ?? member.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{member.full_name ?? '—'}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{member.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm">
                        {member.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground/60" />{member.email}</span>}
                        {member.mobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground/60" />{member.mobile}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        member.is_active !== false
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${member.is_active !== false ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        {member.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(member.created_at).toLocaleDateString()}
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
