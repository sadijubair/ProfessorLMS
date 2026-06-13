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

type AuditRow = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

export default async function AuditLogsPage() {
  await requireAdminPage(['admin', 'super_admin']);

  const { data } = await supabaseAdmin
    .from('audit_logs')
    .select('id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const logs = (data || []) as AuditRow[];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Immutable record of sensitive Phase 1 operations.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Latest 100 events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Values</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{log.action}</TableCell>
                  <TableCell>
                    {log.entity_type}
                    {log.entity_id ? <div className="text-xs text-muted-foreground">{log.entity_id}</div> : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.user_id}</TableCell>
                  <TableCell className="max-w-md truncate font-mono text-xs">
                    {JSON.stringify(log.new_values || log.old_values || {})}
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
