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
  Phone,
  User,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!acceptedTerms) {
      setError('You must accept the terms and privacy policy.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          mobile,
          whatsappNumber: whatsappNumber || undefined,
          password,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Unable to create account');
        return;
      }

      setSuccess(
        `Account created. Your Student ID is ${result.user.studentId}.`
      );
      setTimeout(() => {
        router.replace('/login');
      }, 1200);
    } catch {
      setError('Unable to create account right now');
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleSignup() {
    window.location.href = '/api/auth/google-start?next=/dashboard';
  }

  return (
    <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 py-10 sm:py-16">
      {/* Background Blur */}
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
                Join The Learning Community
              </div>

              <div className="space-y-5">
                <h1 className="text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                  Start Your
                  <br />
                  Learning Journey.
                </h1>

                <p className="max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  Create your account and access live
                  classes, premium study notes, practice
                  exams, and smart analytics.
                </p>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  'Live Interactive Classes',
                  'Premium Study Materials',
                  'Daily Practice Exams',
                  'Smart Performance Analytics',
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

          {/* Signup Card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-8">
              {/* Header */}
              <div className="mb-8 space-y-3 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500 text-white shadow-lg shadow-sky-500/25">
                  <span className="text-2xl font-black">
                    P
                  </span>
                </div>

                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Create Account
                  </h2>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Join ProfessorLMS today
                  </p>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSignup}
                className="space-y-4"
              >
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>

                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="text"
                      placeholder="Enter your name"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(e.target.value)
                      }
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Mobile Number
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={mobile}
                      onChange={(e) =>
                        setMobile(e.target.value)
                      }
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    WhatsApp Number
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="tel"
                      placeholder="Optional"
                      value={whatsappNumber}
                      onChange={(e) =>
                        setWhatsappNumber(e.target.value)
                      }
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type={
                        showPassword ? 'text' : 'password'
                      }
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 pr-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    <Input
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      disabled={isLoading}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-12 pr-12 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) =>
                        setAcceptedTerms(e.target.checked)
                      }
                      className="peer sr-only"
                    />

                    <div className="flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white transition-all duration-200 peer-checked:border-sky-500 peer-checked:bg-sky-500 dark:border-slate-600 dark:bg-slate-800">
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

                  <span className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="font-medium text-sky-600 hover:text-sky-700"
                    >
                      Terms
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="font-medium text-sky-600 hover:text-sky-700"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                    {error}
                  </p>
                ) : null}

                {success ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    {success}
                  </p>
                ) : null}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl bg-sky-500 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600"
                >
                  {isLoading
                    ? 'Creating account...'
                    : 'Create Account'}

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

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignup}
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
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-sky-600 hover:text-sky-700"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
