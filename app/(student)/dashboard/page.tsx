import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Flame,
  GraduationCap,
  Play,
  TrendingUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { requireStudentPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getStudentAnalytics } from '@/services/analytics.service';

const stats = [
  {
    label: 'Active courses',
    value: '3',
    helper: '2 classes today',
    icon: BookOpen,
    tone: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900',
  },
  {
    label: 'Exam average',
    value: '86%',
    helper: '+8% this month',
    icon: TrendingUp,
    tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
  },
  {
    label: 'Study streak',
    value: '12 days',
    helper: 'Keep it going',
    icon: Flame,
    tone: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900',
  },
  {
    label: 'Class rank',
    value: '#18',
    helper: 'Top 9%',
    icon: Award,
    tone: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900',
  },
];

const courses = [
  {
    title: 'HSC Physics 1st Paper',
    instructor: 'Dr. Rahman',
    progress: 72,
    next: 'Vector revision class',
    time: 'Today, 8:30 PM',
  },
  {
    title: 'Admission Math Batch',
    instructor: 'M. Hasan',
    progress: 54,
    next: 'Permutation practice',
    time: 'Tomorrow, 7:00 PM',
  },
];

const exams = [
  {
    title: 'Weekly Physics MCQ',
    meta: '45 questions',
    due: 'Today, 10:00 PM',
    tone: 'text-rose-600 dark:text-rose-300',
  },
  {
    title: 'Math Model Test 04',
    meta: 'Full syllabus',
    due: 'May 27, 2026',
    tone: 'text-amber-600 dark:text-amber-300',
  },
  {
    title: 'Chemistry Solve Sheet',
    meta: 'Written submission',
    due: 'May 29, 2026',
    tone: 'text-emerald-600 dark:text-emerald-300',
  },
];

const activity = [
  'Completed Biology live class',
  'Submitted Physics solve sheet',
  'Payment approved for Admission Math',
];

type DashboardEnrollment = {
  id: string;
  enrollment_status: string;
  payment_status: string;
  roll_number: string | null;
  courses: {
    title: string;
    price_bdt: number;
    is_free: boolean;
  };
};

export default async function StudentDashboard() {
  const { session, user } = await requireStudentPage();

  const [{ data: enrollmentData }, { data: notificationData }, analytics] = await Promise.all([
    supabaseAdmin
      .from('course_enrollments')
      .select('id, enrollment_status, payment_status, roll_number, courses!inner(title, price_bdt, is_free)')
      .eq('student_id', session.userId)
      .order('enrolled_at', { ascending: false }),
    supabaseAdmin
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', session.userId)
      .order('created_at', { ascending: false })
      .limit(3),
    getStudentAnalytics(session.userId),
  ]);

  const enrollments = ((enrollmentData || []) as unknown) as DashboardEnrollment[];
  const notifications = notificationData || [];
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.enrollment_status === 'active'
  );
  const pendingPayments = enrollments.filter(
    (enrollment) => enrollment.payment_status === 'pending'
  );
  const unpaidEnrollments = enrollments.filter((enrollment) =>
    ['unpaid', 'rejected'].includes(enrollment.payment_status)
  );
  const stats = [
    {
      label: 'Active courses',
      value: String(activeEnrollments.length),
      helper: `${enrollments.length} total enrollment${enrollments.length === 1 ? '' : 's'}`,
      icon: BookOpen,
      tone: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900',
    },
    {
      label: 'Accuracy',
      value: `${analytics.summary.accuracy}%`,
      helper: `${analytics.summary.totalExamAttempts} exams, ${analytics.summary.totalPracticeAttempts} practice`,
      icon: TrendingUp,
      tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
    },
    {
      label: 'Study streak',
      value: `${analytics.summary.streak} day${analytics.summary.streak === 1 ? '' : 's'}`,
      helper: unpaidEnrollments.length ? `${unpaidEnrollments.length} payment action` : 'Practice daily',
      icon: Flame,
      tone: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900',
    },
    {
      label: 'Student ID',
      value: user.student_id || 'N/A',
      helper: user.mobile || user.email || 'Profile incomplete',
      icon: Award,
      tone: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900',
    },
  ];
  const courses = activeEnrollments.slice(0, 2).map((enrollment) => ({
    title: enrollment.courses.title,
    instructor: enrollment.roll_number ? `Roll ${enrollment.roll_number}` : 'Roll pending',
    progress: enrollment.enrollment_status === 'active' ? 15 : 0,
    next: enrollment.payment_status === 'approved' ? 'Continue course materials' : 'Payment verification pending',
    time: enrollment.payment_status,
  }));
  const exams = pendingPayments.length
    ? pendingPayments.map((enrollment) => ({
        title: enrollment.courses.title,
        meta: 'Payment under review',
        due: 'Support queue',
        tone: 'text-amber-600 dark:text-amber-300',
      }))
    : unpaidEnrollments.slice(0, 3).map((enrollment) => ({
        title: enrollment.courses.title,
        meta: 'Submit payment to activate',
        due: 'Action needed',
        tone: 'text-rose-600 dark:text-rose-300',
      }));
  const activity = notifications.length
    ? notifications.map((notification) => notification.title)
    : ['No recent activity yet'];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:gap-6 md:p-6 xl:p-8">
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="grid gap-6 p-5 md:grid-cols-[1.35fr_0.65fr] md:p-6 xl:p-7">
          <div className="flex min-w-0 flex-col justify-between gap-6">
            <div className="space-y-3">
              <Badge variant="secondary" className="w-fit gap-1.5 rounded-md">
                <GraduationCap className="h-3.5 w-3.5" />
                Student workspace
              </Badge>
              <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Good evening, {user.full_name?.split(' ')[0] || 'Student'}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                  You have {activeEnrollments.length} active course
                  {activeEnrollments.length === 1 ? '' : 's'} and {pendingPayments.length} payment
                  {pendingPayments.length === 1 ? '' : 's'} waiting for verification.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="h-10 justify-center gap-2">
                <Play className="h-4 w-4" />
                Continue learning
              </Button>
              <Button variant="outline" className="h-10 justify-center gap-2">
                <FileText className="h-4 w-4" />
                Take exam
              </Button>
              <Button asChild variant="outline" className="h-10 justify-center gap-2">
                <a href="/dashboard/commerce">Open commerce</a>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next class</p>
                <h2 className="mt-1 text-lg font-semibold">
                  {activeEnrollments[0]?.courses.title || 'Browse courses'}
                </h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Starts</span>
                <span className="font-medium">
                  {activeEnrollments[0] ? activeEnrollments[0].payment_status : 'No active course'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Teacher</span>
                <span className="font-medium">
                  {activeEnrollments[0]?.roll_number || user.student_id || '-'}
                </span>
              </div>
              <Button variant="secondary" className="mt-2 h-9 w-full justify-between">
                Open workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">{stat.value}</p>
              </div>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1 ${stat.tone}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-muted-foreground">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between gap-3 border-b p-4 md:p-5">
            <div>
              <h2 className="text-lg font-semibold">Current courses</h2>
              <p className="text-sm text-muted-foreground">Track your enrolled batches</p>
            </div>
            <Button variant="ghost" size="sm" className="gap-2">
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y">
            {(courses.length ? courses : [
              {
                title: 'No active courses yet',
                instructor: 'Enroll in a course to begin',
                progress: 0,
                next: 'Browse published courses',
                time: 'Ready',
              },
            ]).map((course) => (
              <div key={course.title} className="p-4 md:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{course.instructor}</p>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-md">
                    {course.progress}% complete
                  </Badge>
                </div>
                <div className="mt-4 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">{course.next}</span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    {course.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-lg border bg-card">
            <div className="border-b p-4 md:p-5">
              <h2 className="text-lg font-semibold">Upcoming exams</h2>
              <p className="text-sm text-muted-foreground">Deadlines and practice tests</p>
            </div>
            <div className="divide-y">
              {(exams.length ? exams : [
                {
                  title: 'No pending payment actions',
                  meta: 'You are clear for Phase 1 revenue flow',
                  due: 'All set',
                  tone: 'text-emerald-600 dark:text-emerald-300',
                },
              ]).map((exam) => (
                <div key={exam.title} className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileText className={`h-4 w-4 ${exam.tone}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{exam.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{exam.meta}</p>
                  </div>
                  <span className="shrink-0 text-right text-xs font-medium text-muted-foreground">
                    {exam.due}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">Payments clear</p>
                  <p className="text-sm text-muted-foreground">No pending dues</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">Next invoice</p>
                  <p className="text-sm text-muted-foreground">Admission Math, June 1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="border-b p-4 md:p-5">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <p className="text-sm text-muted-foreground">Latest study and account updates</p>
        </div>
        <div className="grid gap-0 divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
          {activity.map((item) => (
            <div key={item} className="flex items-center gap-3 p-4">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
