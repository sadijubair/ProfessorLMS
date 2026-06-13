import Link from 'next/link';
import { notFound } from 'next/navigation';
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
import { supabaseAdmin } from '@/lib/db/supabase';
import { getExamLeaderboard, getExamWindowState } from '@/services/exam.service';

type LeaderboardRow = {
  id: string;
  rank: number;
  total_marks: number;
  accuracy_percent: number | null;
  student_id: string;
  users: {
    full_name: string | null;
    student_id: string | null;
  };
};

export default async function ExamLeaderboardPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { session } = await requireStudentPage();
  const { examId } = await params;

  const { data: exam } = await supabaseAdmin
    .from('exams')
    .select('id, title, course_id, window_start_at, window_end_at, total_marks')
    .eq('id', examId)
    .maybeSingle();

  if (!exam) {
    notFound();
  }

  // For open (platform-wide) exams, no course enrollment check is needed
  if (exam.course_id) {
    const { data: enrollment } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('student_id', session.userId)
      .eq('course_id', exam.course_id)
      .eq('enrollment_status', 'active')
      .maybeSingle();

    if (!enrollment) {
      notFound();
    }
  }

  const isClosed = getExamWindowState(exam) === 'closed';
  const leaderboard = isClosed
    ? ((await getExamLeaderboard(examId)) as unknown as LeaderboardRow[])
    : [];
  const myRank = leaderboard.find((row) => row.student_id === session.userId);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant={isClosed ? 'default' : 'secondary'}>
            {isClosed ? 'Published' : 'Locked'}
          </Badge>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">
            Official leaderboard. Practice attempts are excluded.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/exams">Back to exams</Link>
        </Button>
      </div>

      {!isClosed ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            The leaderboard is available after the exam window closes.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="grid gap-4 p-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Your rank</p>
                <p className="mt-1 text-2xl font-bold">{myRank?.rank ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your marks</p>
                <p className="mt-1 text-2xl font-bold">
                  {myRank ? `${myRank.total_marks}/${exam.total_marks}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="mt-1 text-2xl font-bold">{leaderboard.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Merit List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((row) => (
                    <TableRow key={row.id} className={row.student_id === session.userId ? 'bg-primary/5' : ''}>
                      <TableCell className="font-semibold">#{row.rank}</TableCell>
                      <TableCell>
                        <div className="font-medium">{row.users.full_name || 'Student'}</div>
                        <div className="text-xs text-muted-foreground">{row.users.student_id || '-'}</div>
                      </TableCell>
                      <TableCell>{row.total_marks}</TableCell>
                      <TableCell>{row.accuracy_percent ?? 0}%</TableCell>
                    </TableRow>
                  ))}
                  {!leaderboard.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        No official submissions yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
