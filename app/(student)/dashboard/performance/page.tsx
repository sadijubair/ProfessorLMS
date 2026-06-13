import { Activity, BarChart3, Target, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressChart } from '@/components/student/progress-chart';
import { requireStudentPage } from '@/lib/auth/server';
import { getStudentAnalytics } from '@/services/analytics.service';

export default async function StudentPerformancePage() {
  const { session } = await requireStudentPage();
  const analytics = await getStudentAnalytics(session.userId);

  const summaryCards = [
    {
      label: 'Accuracy',
      value: `${analytics.summary.accuracy}%`,
      icon: Target,
    },
    {
      label: 'Average marks',
      value: analytics.summary.averageMarks.toString(),
      icon: TrendingUp,
    },
    {
      label: 'Exam attempts',
      value: analytics.summary.totalExamAttempts.toString(),
      icon: BarChart3,
    },
    {
      label: 'Practice streak',
      value: `${analytics.summary.streak} day${analytics.summary.streak === 1 ? '' : 's'}`,
      icon: Activity,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <p className="text-sm text-muted-foreground">
          Accuracy, rank trend, subject breakdown, weak areas, and practice history.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exam Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              data={analytics.rankTrend.map((item) => ({
                label: item.label,
                value: item.accuracy,
              }))}
              suffix="%"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart
              data={analytics.subjectPerformance.slice(0, 8).map((item) => ({
                label: item.label,
                value: item.accuracy,
              }))}
              suffix="%"
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Weak Areas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {analytics.weakAreas.map((area) => (
            <div key={area.label} className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{area.label}</p>
                <p className="text-sm text-muted-foreground">{area.accuracy}%</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{area.attempts} practice attempts</p>
            </div>
          ))}
          {!analytics.weakAreas.length ? (
            <p className="text-sm text-muted-foreground">Weak areas appear after practice attempts.</p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
