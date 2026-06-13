'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, Play, RotateCcw, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ExamSummary = {
  id: string;
  title: string;
  description: string | null;
  exam_type: 'mcq' | 'written' | 'combined';
  total_questions: number;
  total_marks: number;
  window_start_at: string;
  window_end_at: string;
  individual_duration_minutes: number;
  window_state: 'upcoming' | 'live' | 'closed';
  practice_available: boolean;
};

export default function StudentExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadExams() {
    setIsLoading(true);
    setError(null);

    const response = await fetch('/api/exams');
    const payload = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(payload.error ?? 'Unable to load exams');
      return;
    }

    setExams(payload.exams ?? []);
  }

  useEffect(() => {
    loadExams();
  }, []);

  async function startExam(exam: ExamSummary, practice: boolean) {
    setError(null);
    const response = await fetch(`/api/exams/${exam.id}/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ practice }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? 'Unable to start exam');
      return;
    }

    router.push(`/exams/${payload.attempt.id}`);
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
            <p className="text-sm text-muted-foreground">
              Live exams, official attempts, and post-window practice.
            </p>
          </div>

          <Button type="button" variant="outline" onClick={loadExams} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <section key={exam.id} className="rounded-lg border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={exam.window_state === 'live' ? 'default' : 'secondary'}>
                      {exam.window_state}
                    </Badge>
                    <Badge variant="outline">{exam.exam_type.toUpperCase()}</Badge>
                  </div>
                  <h2 className="text-xl font-semibold">{exam.title}</h2>
                </div>
                <CalendarClock className="mt-1 size-5 text-muted-foreground" />
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {exam.description ?? 'No description provided.'}
              </p>

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Questions</dt>
                  <dd className="font-medium">{exam.total_questions}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Marks</dt>
                  <dd className="font-medium">{exam.total_marks}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{exam.individual_duration_minutes}m</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={exam.window_state !== 'live'}
                  onClick={() => startExam(exam, false)}
                >
                  <Play className="size-4" />
                  Start
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!exam.practice_available}
                  onClick={() => startExam(exam, true)}
                >
                  <RotateCcw className="size-4" />
                  Practice
                </Button>
                {exam.window_state === 'closed' ? (
                  <Button type="button" variant="ghost" asChild>
                    <a href={`/exams/${exam.id}/leaderboard`}>
                      <Trophy className="size-4" />
                      Leaderboard
                    </a>
                  </Button>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        {!isLoading && exams.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No exams loaded.
          </div>
        ) : null}
      </div>
    </main>
  );
}
