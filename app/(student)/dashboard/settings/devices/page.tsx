import { DeviceRemoveButton } from '@/components/student/device-remove-button';
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
import { requireStudentPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export default async function DevicesPage() {
  const { session } = await requireStudentPage();

  const { data } = await supabaseAdmin
    .from('devices')
    .select('*')
    .eq('user_id', session.userId)
    .eq('is_active', true)
    .order('last_active_at', { ascending: false });

  const devices = data || [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Devices</h1>
        <p className="text-sm text-muted-foreground">
          Your account can stay active on two devices. Remove one before logging in on a third device.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Devices ({devices.length}/2)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell className="font-medium">{device.device_name}</TableCell>
                  <TableCell>
                    {device.browser} / {device.os}
                  </TableCell>
                  <TableCell>{device.ip_address}</TableCell>
                  <TableCell>{new Date(device.last_active_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge>Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DeviceRemoveButton deviceId={device.id} />
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
