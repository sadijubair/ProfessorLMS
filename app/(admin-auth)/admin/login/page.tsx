"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadCaptcha = useCallback(async () => {
    const response = await fetch('/api/auth/admin-captcha', {
      cache: 'no-store',
    });
    const result = (await response.json()) as {
      token: string;
      image: string;
    };

    setCaptchaToken(result.token);
    setCaptchaImage(result.image);
    setCaptchaAnswer('');
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCaptcha();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCaptcha]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          portal: 'admin',
          captchaAnswer,
          captchaToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Unable to sign in');
        await loadCaptcha();
        return;
      }

      router.replace('/admin/dashboard');
      router.refresh();
    } catch {
      setError('Unable to sign in right now');
      await loadCaptcha();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-white">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with an authorized staff account.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isLoading}
                placeholder="admin@example.com"
                className="h-12 rounded-xl border-slate-700 bg-slate-950 pl-12 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                placeholder="Password"
                className="h-12 rounded-xl border-slate-700 bg-slate-950 pl-12 pr-12 text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              Security Check
            </label>
            <div className="flex gap-3">
              <div className="flex h-14 flex-1 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                {captchaImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={captchaImage}
                    alt="Captcha numbers"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-slate-500">Loading</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void loadCaptcha()}
                disabled={isLoading}
                className="h-14 w-14 border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
                aria-label="Refresh captcha"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
            <Input
              type="text"
              inputMode="numeric"
              value={captchaAnswer}
              onChange={(event) => setCaptchaAnswer(event.target.value)}
              disabled={isLoading}
              placeholder="Type the numbers from the image"
              className="h-12 rounded-xl border-slate-700 bg-slate-950 text-white"
              required
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full rounded-xl bg-sky-500 text-base font-semibold text-white hover:bg-sky-600"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
            {!isLoading ? <ArrowRight className="ml-2 h-5 w-5" /> : null}
          </Button>
        </form>
      </div>
    </main>
  );
}
