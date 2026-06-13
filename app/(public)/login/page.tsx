'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function getInitialOAuthError() {
  if (typeof window === 'undefined') {
    return { error: '', blocked: false };
  }

  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get('error');

  if (!oauthError) {
    return { error: '', blocked: false };
  }

  if (oauthError === 'device_limit') {
    return { error: 'device_limit', blocked: true };
  }

  const messages: Record<string, string> = {
    google_oauth_start_failed: 'Could not start Google login.',
    google_oauth_callback_failed: 'Google login could not be completed.',
    google_email_missing: 'Google did not return an email address.',
    profile_lookup_failed: 'Could not check your account profile.',
    profile_create_failed: 'Could not create your student profile.',
    use_admin_portal: 'Please use the admin portal for this account.',
    account_disabled: 'Account is disabled.',
    missing_google_code: 'Google login returned without a login code.',
  };

  return {
    error: messages[oauthError] || 'Google login failed.',
    blocked: false,
  };
}

function getSafeNextPath() {
  if (typeof window === 'undefined') {
    return '/dashboard';
  }

  const next = new URLSearchParams(window.location.search).get('next');
  return next?.startsWith('/') ? next : '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [mobileOrEmail, setMobileOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthError] = useState(getInitialOAuthError);
  const [error, setError] = useState(oauthError.error);
  const [blocked, setBlocked] = useState(oauthError.blocked);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBlocked(false);

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileOrEmail,
          password,
          portal: 'student',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setBlocked(Boolean(result.blocked));
        setError(result.error || 'Unable to sign in');
        return;
      }

      router.replace(getSafeNextPath());
      router.refresh();
    } catch {
      setError('Unable to sign in right now');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = `/api/auth/google-start?next=${encodeURIComponent(getSafeNextPath())}`;
  }

  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 py-10 sm:py-16">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="hidden lg:block">
            <div className="max-w-xl space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                <Sparkles className="h-4 w-4" />
                Modern Learning Experience
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Learn Better.
                  <br />
                  Grow Faster.
                </h1>

                <p className="max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  Access live classes, premium study materials,
                  practice exams, and smart analytics in one
                  beautiful learning platform.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  'Live Interactive Classes',
                  'Daily Practice Exams',
                  'Smart Analytics',
                  'Premium PDF Notes',
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />

                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
              {/* Header */}
              <div className="mb-8 space-y-3 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500 text-white shadow-lg shadow-sky-500/30">
                  <span className="text-2xl font-black">P</span>
                </div>

                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Welcome Back
                  </h2>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Sign in to continue your learning journey
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email / Mobile */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email or Mobile Number
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="text"
                      placeholder="you@example.com or 01XXXXXXXXX"
                      value={mobileOrEmail}
                      onChange={(e) => setMobileOrEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-sky-600 hover:text-sky-700"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 pr-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <div className="flex items-center justify-between">
                  {/* Remember Me */}
<label className="flex items-center gap-3 cursor-pointer select-none">
  <div className="relative">
    <input
      type="checkbox"
      className="peer sr-only"
    />

    {/* Custom Checkbox */}
    <div className="h-5 w-5 rounded-md border border-slate-300 bg-white transition-all duration-200 peer-checked:border-sky-500 peer-checked:bg-sky-500 dark:border-slate-600 dark:bg-slate-800 flex items-center justify-center">
      <svg
        className="h-3 w-3 scale-0 text-white transition-transform duration-200 peer-checked:scale-100"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>
  </div>

  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
    Remember me
  </span>
</label>
                </div>

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                    {blocked
                      ? 'Device Limit Reached. Your account is already active on 2 devices. To log in on this device, open your dashboard on an existing logged-in device, go to Settings > Devices, and remove one active device.'
                      : error}
                  </p>
                ) : null}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-sky-500 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}

                  {!isLoading && (
                    <ArrowRight className="ml-2 h-5 w-5" />
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    Or Continue With
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="h-12 w-full rounded-xl border-slate-200 bg-white font-medium dark:border-slate-700 dark:bg-slate-900"
              >
                <svg
                  className="mr-3 h-5 w-5"
                  viewBox="0 0 48 48"
                >
                  <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.6-4.6 2.4-7.3 2.4-5.3 0-9.8-3.3-11.4-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6.1 7.1l6.2 5.2C39.2 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
                  />
                </svg>

                Continue with Google
              </Button>

              {/* Footer */}
              <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/signup"
                  className="font-semibold text-sky-600 hover:text-sky-700"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
