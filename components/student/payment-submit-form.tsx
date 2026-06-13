'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const methods = [
  ['bkash', 'bKash'],
  ['nagad', 'Nagad'],
  ['rocket', 'Rocket'],
  ['bank_transfer', 'Bank Transfer'],
] as const;

export function PaymentSubmitForm({
  enrollmentId,
  amountBdt,
  redirectTo = '/dashboard/payments?submitted=1',
}: {
  enrollmentId: string;
  amountBdt: number;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true);
    setStatus(null);

    const response = await fetch('/api/payments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollmentId,
        amountBdt,
        paymentMethod: formData.get('paymentMethod'),
        transactionId: formData.get('transactionId'),
        senderMobile: formData.get('senderMobile'),
        screenshotUrl: formData.get('screenshotUrl') || undefined,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || 'Payment submission failed');
      setSubmitting(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block space-y-2 text-sm font-medium">
        Payment method
        <select
          name="paymentMethod"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          required
        >
          {methods.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-2 text-sm font-medium">
        Transaction ID
        <Input name="transactionId" required />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        Sender mobile
        <Input name="senderMobile" required placeholder="01XXXXXXXXX" />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        Screenshot URL
        <Textarea
          name="screenshotUrl"
          placeholder="Paste uploaded screenshot URL if available"
        />
      </label>
      {status ? <p className="text-sm text-destructive">{status}</p> : null}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit payment for verification'}
      </Button>
    </form>
  );
}
