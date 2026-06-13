import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { requireAdminPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import {
  ShieldCheck, Mail, Phone, Calendar, MoreHorizontal,
} from 'lucide-react';

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  role: string;
  student_id: string | null;
  created_at: string;
  is_active: boolean | null;
};

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  super_admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  support: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLOR[role] ?? ROLE_COLOR.support}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

function StatusDot({ active }: { active: boolean | null }) {
  return (
    <span className={`inline-flex h-2 w-2 rounded-full ${active !== false ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
  );
}

export default async function AdminUsersAdminPage() {
  await requireAdminPage(['admin', 'super_admin']);

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, mobile, role, student_id, created_at, is_active')
    .in('role', ['admin', 'super_admin', 'support'])
    .order('created_at', { ascending: false }) as { data: UserRow[] | null };

  const users = data ?? [];

  const admins      = users.filter(u => u.role === 'admin' || u.role === 'super_admin');
  const supportStaff = users.filter(u => u.role === 'support');

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          </div>
          <p className="text-muted-foreground">
            Manage administrators and super-admins who have full platform access.
          </p>
        </div>
        <AddUserDialog role="admin" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Admins', value: users.length, color: 'text-primary' },
          { label: 'Super Admins', value: admins.filter(u => u.role === 'super_admin').length, color: 'text-rose-500' },
          { label: 'Admins', value: admins.filter(u => u.role === 'admin').length, color: 'text-amber-500' },
          { label: 'Support Staff', value: supportStaff.length, color: 'text-sky-500' },
        ].map(stat => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-5 pb-4">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Admin &amp; Support Users</CardTitle>
          <CardDescription>{users.length} users with elevated roles</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 opacity-20" />
              <p className="text-sm">No admin users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name ?? '—'}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{user.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-sm">
                        {user.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground/60" />{user.email}</span>}
                        {user.mobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground/60" />{user.mobile}</span>}
                      </div>
                    </TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <StatusDot active={user.is_active} />
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString()}
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
