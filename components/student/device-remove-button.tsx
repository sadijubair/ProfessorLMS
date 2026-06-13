'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function DeviceRemoveButton({ deviceId }: { deviceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function removeDevice() {
    setBusy(true);

    await fetch('/api/devices/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });

    router.refresh();
  }

  return (
    <Button size="sm" variant="destructive" disabled={busy} onClick={removeDevice}>
      {busy ? 'Removing...' : 'Remove'}
    </Button>
  );
}
