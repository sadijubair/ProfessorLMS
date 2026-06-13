import { NotificationReadButton } from '@/components/student/notification-read-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { requireStudentPage } from '@/lib/auth/server';
import { getNotifications } from '@/services/notification.service';

export default async function NotificationsPage() {
  const { session } = await requireStudentPage();
  const result = await getNotifications(session.userId, 50, 0);
  const notifications = result.success && result.data ? result.data : [];

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">Payment, enrollment, and course updates.</p>
      </div>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{notification.title}</h2>
                  <Badge variant={notification.is_read ? 'outline' : 'default'}>
                    {notification.is_read ? 'Read' : 'Unread'}
                  </Badge>
                  <Badge variant="secondary">{notification.type}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
              {!notification.is_read ? (
                <NotificationReadButton notificationId={notification.id} />
              ) : null}
            </CardContent>
          </Card>
        ))}
        {!notifications.length ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
