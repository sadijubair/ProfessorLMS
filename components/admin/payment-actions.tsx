'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(action: 'approve' | 'reject') {
    setBusy(true);
    setStatus(null);

    const response = await fetch(`/api/payments/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        action === 'approve' ? { paymentId } : { paymentId, rejectionReason: reason }
      ),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || `${action} failed`);
      setBusy(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-72 flex-col gap-2">
      <div className="flex gap-2">
        <Button size="sm" disabled={busy} onClick={() => submit('approve')}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={busy || !reason.trim()}
          onClick={() => submit('reject')}
        >
          Reject
        </Button>
      </div>
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Rejection reason"
        className="h-8"
      />
      {status ? <p className="text-xs text-destructive">{status}</p> : null}
    </div>
  );
}
