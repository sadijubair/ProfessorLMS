import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireStudentPage } from '@/lib/auth/server';

export default async function StudentSettingsPage() {
  const { user } = await requireStudentPage();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Profile and device controls.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{user.full_name || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Student ID</p>
            <p className="font-medium">{user.student_id || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user.email || '-'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Mobile</p>
            <p className="font-medium">{user.mobile || '-'}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard/settings/devices">Manage devices</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/notifications">Notifications</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
