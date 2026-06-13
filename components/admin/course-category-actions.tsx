'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function CourseCategoryActions({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);

    await fetch(`/api/course-categories/${categoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });

    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" disabled={busy} onClick={toggle}>
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  );
}
