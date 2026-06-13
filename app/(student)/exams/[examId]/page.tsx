'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, Clock, Flag, Send, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type AttemptPayload = {
  attempt: {
    id: string;
    status: 'in_progress' | 'submitted' | 'evaluated';
    is_official: boolean;
    total_correct: number;
    total_wrong: number;
    total_unanswered: number;
    total_marks_obtained: number | null;
  };
  exam: {
    id: string;
    title: string;
    instructions: string | null;
    total_marks: number;
  };
  can_review: boolean;
  deadline: string;
  questions: Array<{
    id: string;
    content: string;
    type: string;
    marks: number;
    sequence_order: number;
    selected_option_id: string | null;
    is_correct: boolean | null;
    marked_for_review: boolean;
    explanation: string | null;
    solution: string | null;
    options: Array<{
      id: string;
      option_label: string;
      option_text: string;
      is_correct?: boolean;
    }>;
  }>;
};

export default function ExamAttemptPage() {
  const params = useParams<{ examId: string }>();
  const attemptId = params.examId;
  const [payload, setPayload] = useState<AttemptPayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [reviewMarks, setReviewMarks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadAttempt() {
      const response = await fetch(`/api/exam-attempts/${attemptId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Unable to load attempt');
        return;
      }

      setPayload(data);
      setSelectedAnswers(
        Object.fromEntries(
          data.questions
            .filter((question: AttemptPayload['questions'][number]) => question.selected_option_id)
            .map((question: AttemptPayload['questions'][number]) => [
              question.id,
              question.selected_option_id,
            ])
        )
      );
      setReviewMarks(
        Object.fromEntries(
          data.questions.map((question: AttemptPayload['questions'][number]) => [
            question.id,
            question.marked_for_review,
          ])
        )
      );
    }

    loadAttempt();
  }, [attemptId]);

  const secondsRemaining = useMemo(() => {
    if (!payload) return 0;
    return Math.max(0, Math.floor((new Date(payload.deadline).getTime() - now) / 1000));
  }, [payload, now]);

  async function saveAnswer(questionId: string, selectedOptionId: string) {
    setSelectedAnswers((current) => ({ ...current, [questionId]: selectedOptionId }));

    const response = await fetch(`/api/exam-attempts/${attemptId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, selectedOptionId, markedForReview: reviewMarks[questionId] }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Unable to save answer');
    }
  }

  async function toggleReview(questionId: string) {
    const markedForReview = !reviewMarks[questionId];
    setReviewMarks((current) => ({ ...current, [questionId]: markedForReview }));

    const response = await fetch(`/api/exam-attempts/${attemptId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, markedForReview }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Unable to update review mark');
    }
  }

  async function submit(reason: 'manual' | 'deadline_expired' = 'manual') {
    setIsSubmitting(true);
    const response = await fetch(`/api/exam-attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? 'Unable to submit attempt');
      return;
    }

    setPayload((current) =>
      current ? { ...current, attempt: { ...current.attempt, status: data.attempt.status } } : current
    );
  }

  useEffect(() => {
    if (
      payload?.attempt.status === 'in_progress' &&
      secondsRemaining === 0 &&
      !isSubmitting &&
      !autoSubmitted
    ) {
      setAutoSubmitted(true);
      submit('deadline_expired');
    }
  }, [payload?.attempt.status, secondsRemaining, isSubmitting, autoSubmitted]);

  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
        {error ?? 'Loading exam...'}
      </main>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isLocked = payload.attempt.status !== 'in_progress' || secondsRemaining === 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const reviewCount = Object.values(reviewMarks).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background/95 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={payload.attempt.is_official ? 'default' : 'secondary'}>
                {payload.attempt.is_official ? 'Official' : 'Practice'}
              </Badge>
              <Badge variant="outline">{payload.attempt.status}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">{payload.exam.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
              <Clock className="size-4" />
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <Button onClick={() => submit('manual')} disabled={isSubmitting || payload.attempt.status !== 'in_progress'}>
              <Send className="size-4" />
              Submit
            </Button>
          </div>
        </header>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {payload.attempt.status !== 'in_progress' ? (
          <section className="grid gap-3 rounded-lg border bg-card p-4 text-sm md:grid-cols-5">
            <div>
              <p className="text-muted-foreground">Score</p>
              <p className="text-xl font-bold">
                {payload.attempt.total_marks_obtained ?? 0}/{payload.exam.total_marks}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Correct</p>
              <p className="text-xl font-bold text-emerald-600">{payload.attempt.total_correct}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Wrong</p>
              <p className="text-xl font-bold text-red-600">{payload.attempt.total_wrong}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Unanswered</p>
              <p className="text-xl font-bold">{payload.attempt.total_unanswered}</p>
            </div>
            <Button asChild variant="outline" className="self-center">
              <a href={`/exams/${payload.exam.id}/leaderboard`}>
                <Trophy className="size-4" />
                Leaderboard
              </a>
            </Button>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
          <div className="space-y-4">
            {payload.questions.map((question) => (
              <section id={question.id} key={question.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-base font-semibold">
                    {question.sequence_order}. {question.content}
                  </h2>
                  <Badge variant="secondary">{question.marks} mark</Badge>
                </div>
                <div className="mt-4 grid gap-2">
                  {question.options.map((option) => {
                    const isSelected = selectedAnswers[question.id] === option.id;
                    const isCorrect = payload.can_review && option.is_correct;
                    const isWrongSelection =
                      payload.can_review &&
                      isSelected &&
                      question.is_correct === false;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() => saveAnswer(question.id, option.id)}
                        className={`flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-90 ${
                          isCorrect
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100'
                            : isWrongSelection
                              ? 'border-red-300 bg-red-50 text-red-950 dark:bg-red-950/20 dark:text-red-100'
                              : ''
                        }`}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md border font-medium">
                          {option.option_label}
                        </span>
                        <span className="flex-1">{option.option_text}</span>
                        {isSelected ? <CheckCircle2 className="size-4 text-primary" /> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={reviewMarks[question.id] ? 'default' : 'outline'}
                    size="sm"
                    disabled={isLocked}
                    onClick={() => toggleReview(question.id)}
                  >
                    <Flag className="size-4" />
                    {reviewMarks[question.id] ? 'Marked' : 'Mark for review'}
                  </Button>
                  {payload.can_review && (question.explanation || question.solution) ? (
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                      {question.explanation ? (
                        <p>
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </p>
                      ) : null}
                      {question.solution ? (
                        <p className="mt-1">
                          <span className="font-medium">Solution:</span> {question.solution}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {!payload.can_review && payload.attempt.status !== 'in_progress' ? (
                    <p className="text-xs text-muted-foreground">
                      Answers and explanations unlock after the official exam window closes.
                    </p>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <aside className="h-fit rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold">Navigator</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {answeredCount}/{payload.questions.length} answered, {reviewCount} marked
            </p>
            <div className="mt-3 grid grid-cols-5 gap-2 md:grid-cols-4">
              {payload.questions.map((question) => (
                <a
                  key={question.id}
                  href={`#${question.id}`}
                  className={`flex aspect-square items-center justify-center rounded-md border text-sm font-medium ${
                    selectedAnswers[question.id]
                      ? 'border-primary bg-primary/10 text-primary'
                      : reviewMarks[question.id]
                        ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950/30'
                        : ''
                  }`}
                >
                  {question.sequence_order}
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
