import Link from 'next/link';
import { Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireStudentPage } from '@/lib/auth/server';
import { getAggregateLeaderboard } from '@/services/exam.service';

export default async function StudentLeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; courseId?: string }>;
}) {
  await requireStudentPage();

  const params = await searchParams;
  const scope = ['weekly', 'monthly', 'batch'].includes(params.scope || '')
    ? (params.scope as 'weekly' | 'monthly' | 'batch')
    : 'weekly';
  const leaderboard = await getAggregateLeaderboard({ scope, courseId: params.courseId });

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboards</h1>
          <p className="text-sm text-muted-foreground">
            Weekly, monthly, and batch rankings from official attempts only.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/exams">View exams</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['weekly', 'monthly', 'batch'] as const).map((item) => (
          <Button key={item} asChild variant={scope === item ? 'default' : 'outline'} size="sm">
            <Link href={`/dashboard/leaderboards?scope=${item}`}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Link>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {scope.charAt(0).toUpperCase() + scope.slice(1)} Ranking
            <Badge variant="secondary">Official</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((row) => (
                <TableRow key={row.student_id}>
                  <TableCell className="font-semibold">#{row.rank}</TableCell>
                  <TableCell>
                    <div className="font-medium">{row.full_name || 'Student'}</div>
                    <div className="text-xs text-muted-foreground">{row.platform_student_id || '-'}</div>
                  </TableCell>
                  <TableCell>{row.attempts}</TableCell>
                  <TableCell>{row.total_marks.toFixed(2)}</TableCell>
                  <TableCell>{row.accuracy_percent ?? 0}%</TableCell>
                </TableRow>
              ))}
              {!leaderboard.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No official submissions in this scope yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
