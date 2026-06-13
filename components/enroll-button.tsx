'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function EnrollButton({
  courseId,
  isFree,
  priceBdt,
}: {
  courseId: string;
  isFree: boolean;
  priceBdt: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function enroll() {
    setSubmitting(true);
    setStatus(null);

    const response = await fetch('/api/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId }),
    });

    if (response.status === 401 || response.status === 403) {
      router.push(`/login?next=${encodeURIComponent(pathname || '/courses')}`);
      return;
    }

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || 'Enrollment failed');
      setSubmitting(false);
      return;
    }

    if (payload.requiresPayment) {
      router.push(`/checkout?enrollmentId=${payload.data.id}`);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" size="lg" onClick={enroll} disabled={submitting}>
        {submitting
          ? 'Processing...'
          : isFree
            ? 'Enroll for free'
            : `Enroll and pay BDT ${priceBdt.toLocaleString()}`}
      </Button>
      {status ? <p className="text-sm text-destructive">{status}</p> : null}
    </div>
  );
}
