'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function CourseCategoryForm({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(formData: FormData) {
    setBusy(true);
    setStatus(null);

    const response = await fetch('/api/course-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        description: formData.get('description'),
        isActive: true,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || 'Could not create category');
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
  }

  return (
    <form action={submit} className="grid gap-3">
      <label className="space-y-2 text-sm font-medium">
        Category name
        <Input name="name" required placeholder="BCS" disabled={disabled} />
      </label>
      <label className="space-y-2 text-sm font-medium">
        Description
        <Textarea name="description" rows={3} disabled={disabled} />
      </label>
      {status ? <p className="text-sm text-destructive">{status}</p> : null}
      <Button type="submit" disabled={busy || disabled}>
        {disabled ? 'Run migration first' : busy ? 'Creating...' : 'Create category'}
      </Button>
    </form>
  );
}
