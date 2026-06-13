'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function NotificationReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function markRead() {
    setBusy(true);

    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId }),
    });

    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={markRead}>
      Mark read
    </Button>
  );
}
