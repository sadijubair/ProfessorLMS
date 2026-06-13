'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserPlus, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';

// Inline label — no external dependency needed
function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-foreground"
    >
      {children}
    </label>
  );
}

export type UserRole = 'admin' | 'super_admin' | 'teacher' | 'mentor' | 'student' | 'support';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  teacher: 'Teacher',
  mentor: 'Mentor',
  student: 'Student',
  support: 'Support Staff',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  super_admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
  teacher: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  mentor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  support: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
};

interface AddUserDialogProps {
  role: UserRole;
  /** Called after successful creation so parent can refresh */
  onSuccess?: () => void;
}

export function AddUserDialog({ role, onSuccess }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setFullName(''); setEmail(''); setMobile(''); setPassword('');
    setError(null); setSuccess(false); setShowPassword(false);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    setOpen(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, mobile: mobile || undefined, password, role }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to create user.');
        } else {
          setSuccess(true);
          onSuccess?.();
          setTimeout(() => { setOpen(false); reset(); }, 1200);
        }
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" />
          Add {ROLE_LABELS[role]}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New {ROLE_LABELS[role]}
          </DialogTitle>
          <DialogDescription>
            Create a new{' '}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role]}
            </span>{' '}
            account. They can log in immediately after creation.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">User created successfully!</p>
            <p className="text-sm text-muted-foreground">Refreshing the list…</p>
          </div>
        ) : (
          <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="au-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="au-name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Md. Rafiqul Islam"
                required
                disabled={pending}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="au-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="au-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                required
                disabled={pending}
              />
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <Label htmlFor="au-mobile">Mobile (optional)</Label>
              <Input
                id="au-mobile"
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                disabled={pending}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="au-password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="au-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  disabled={pending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && password.length < 8 && (
                <p className="text-xs text-destructive">Password must be at least 8 characters</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
        )}

        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-user-form"
              disabled={pending || !fullName || !email || password.length < 8}
              className="gap-2"
            >
              {pending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
              ) : (
                <><UserPlus className="h-4 w-4" /> Create {ROLE_LABELS[role]}</>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
