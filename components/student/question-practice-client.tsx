'use client';

import { useState } from 'react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PracticeQuestion = {
  id: string;
  course_id: string;
  content: string;
  subject: string | null;
  topic: string | null;
  difficulty_level: 'easy' | 'medium' | 'hard';
  exam_year: number | null;
  question_options: Array<{
    id: string;
    option_label: string;
    option_text: string;
  }>;
};

export function QuestionPracticeClient() {
  const [mode, setMode] = useState('random');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);

  async function loadQuestions() {
    setStatus(null);
    setResults({});

    const params = new URLSearchParams({ mode, limit: '20' });
    if (subject) params.set('subject', subject);
    if (topic) params.set('topic', topic);
    if (difficulty) params.set('difficulty', difficulty);

    const response = await fetch(`/api/questions/practice?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || 'Unable to load questions');
      return;
    }

    setQuestions(payload.questions || []);
  }

  async function answer(questionId: string, selectedOptionId: string) {
    const response = await fetch('/api/questions/practice/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId,
        selectedOptionId,
        practiceMode: mode,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error || 'Unable to submit answer');
      return;
    }

    setResults((current) => ({ ...current, [questionId]: Boolean(payload.attempt.is_correct) }));
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5">
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="random">Random</option>
          <option value="topic">Topic practice</option>
          <option value="timed">Timed practice</option>
          <option value="previous_year">Previous year</option>
          <option value="weak_area">Weak area</option>
        </select>
        <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
        <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Topic" />
        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="">Any difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <Button type="button" onClick={loadQuestions}>
          <Search className="h-4 w-4" />
          Start
        </Button>
      </section>

      {status ? <div className="rounded-md border bg-card p-4 text-sm">{status}</div> : null}

      <div className="space-y-4">
        {questions.map((question, index) => {
          const result = results[question.id];
          const answered = question.id in results;

          return (
            <section key={question.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{question.subject || 'General'}</Badge>
                    <Badge variant="outline">{question.topic || 'Mixed'}</Badge>
                    <Badge variant="outline">{question.difficulty_level}</Badge>
                    {question.exam_year ? <Badge variant="outline">{question.exam_year}</Badge> : null}
                  </div>
                  <h2 className="mt-3 font-semibold">
                    {index + 1}. {question.content}
                  </h2>
                </div>
                {answered ? (
                  result ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )
                ) : null}
              </div>

              <div className="mt-4 grid gap-2">
                {question.question_options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={answered}
                    onClick={() => answer(question.id, option.id)}
                    className="flex min-h-11 items-center gap-3 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border font-medium">
                      {option.option_label}
                    </span>
                    <span>{option.option_text}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {!questions.length ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Choose filters and start a practice set.
        </div>
      ) : null}
    </div>
  );
}
