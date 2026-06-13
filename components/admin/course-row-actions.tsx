'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function CourseRowActions({
  courseId,
  published,
}: {
  courseId: string;
  published: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function mutate(action: 'publish' | 'unpublish' | 'delete') {
    setBusy(true);
    setStatus(null);

    const response = await fetch(`/api/admin/courses/${courseId}`, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: action === 'delete' ? undefined : { 'Content-Type': 'application/json' },
      body: action === 'delete' ? undefined : JSON.stringify({ action }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || 'Action failed');
      setBusy(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex min-w-52 flex-col gap-2">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => mutate(published ? 'unpublish' : 'publish')}
        >
          {published ? 'Unpublish' : 'Publish'}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() => mutate('delete')}
        >
          Delete
        </Button>
      </div>
      {status ? <p className="text-xs text-destructive">{status}</p> : null}
    </div>
  );
}
