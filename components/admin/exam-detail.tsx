'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, ListChecks, Users, Trophy, Settings,
  Globe, Lock, Zap, PenLine, BarChart3, Clock, Target,
  CheckCircle2, XCircle, AlertCircle, Loader2, Trash2,
  ArrowUpDown, RefreshCw, Eye, EyeOff, Edit3, X, Plus, Minus,
  Calendar, Timer, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type WindowState = 'upcoming' | 'live' | 'closed';

type Exam = {
  id: string;
  title: string;
  description: string | null;
  scope: 'course' | 'open';
  course_id: string | null;
  course_title: string | null;
  exam_type: 'mcq' | 'written' | 'combined';
  total_questions: number;
  total_marks: number;
  passing_marks: number | null;
  negative_marking: number | null;
  window_start_at: string;
  window_end_at: string;
  individual_duration_minutes: number;
  shuffle_questions: boolean;
  show_answers_after: boolean;
  instructions: string | null;
  published_at: string | null;
  created_at: string;
  window_state: WindowState;
};

type ExamQuestion = {
  id: string;
  marks: number;
  sequence_order: number;
  questions: {
    id: string;
    content: string;
    subject: string;
    topic: string;
    difficulty_level: 'easy' | 'medium' | 'hard';
    type: string;
  };
};

type Attempt = {
  id: string;
  student_id: string;
  roll_number: string | null;
  status: 'in_progress' | 'submitted' | 'evaluated';
  started_at: string;
  submitted_at: string | null;
  total_questions_attempted: number;
  total_correct: number;
  total_wrong: number;
  total_marks_obtained: number | null;
  mcq_marks_obtained: number | null;
  written_marks_obtained: number | null;
  is_official: boolean;
  users: { full_name: string | null; student_id: string | null; email: string | null };
};

type LeaderboardEntry = {
  id: string;
  rank: number;
  total_marks: number;
  accuracy_percent: number | null;
  users: { full_name: string | null; student_id: string | null };
};

type Course = { id: string; title: string };

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: LayoutDashboard },
  { id: 'questions',   label: 'Questions',   icon: ListChecks      },
  { id: 'attempts',    label: 'Attempts',    icon: Users           },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy          },
  { id: 'settings',    label: 'Settings',    icon: Settings        },
] as const;
type Tab = typeof TABS[number]['id'];

const STATUS_BADGE: Record<WindowState, { label: string; cls: string }> = {
  upcoming: { label: 'Upcoming',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'    },
  live:     { label: 'Live 🔴',   cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  closed:   { label: 'Closed',    cls: 'bg-muted text-muted-foreground'                     },
};

const DIFF_COLORS = {
  easy:   'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-400',
  hard:   'bg-rose-500/10 text-rose-400',
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  mcq:      <BarChart3 className="size-3.5" />,
  written:  <PenLine className="size-3.5" />,
  combined: <Zap className="size-3.5" />,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' });
}

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ExamDetail({
  initialExam,
  initialQuestions,
  initialAttempts,
  initialLeaderboard,
  courses,
}: {
  initialExam: Exam;
  initialQuestions: ExamQuestion[];
  initialAttempts: Attempt[];
  initialLeaderboard: LeaderboardEntry[];
  courses: Course[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [exam, setExam]           = useState(initialExam);
  const [questions, setQuestions] = useState(initialQuestions);
  const [attempts]                = useState(initialAttempts);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [publishing, setPublishing]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [error, setError]             = useState('');

  const isDraft    = !exam.published_at;
  const hasAttempts = attempts.length > 0;

  // ─── Publish / Unpublish ────────────────────────────────────────────────────
  const togglePublish = async () => {
    setPublishing(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          published_at: isDraft ? new Date().toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExam((prev) => ({ ...prev, published_at: data.exam.published_at }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setPublishing(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm('Delete this exam? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/admin/exams');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  const statusBadge = STATUS_BADGE[exam.window_state];
  const officialAttempts = attempts.filter((a) => a.is_official);
  const submittedAttempts = officialAttempts.filter((a) => a.status !== 'in_progress');
  const avgScore = submittedAttempts.length
    ? submittedAttempts.reduce((s, a) => s + (a.total_marks_obtained ?? 0), 0) / submittedAttempts.length
    : null;
  const passCount = exam.passing_marks
    ? submittedAttempts.filter((a) => (a.total_marks_obtained ?? 0) >= (exam.passing_marks ?? 0)).length
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', statusBadge.cls)}>
              {statusBadge.label}
            </span>
            {isDraft && (
              <span className="inline-flex items-center rounded-full border border-dashed border-muted-foreground/40 px-2.5 py-0.5 text-xs text-muted-foreground">
                Draft
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              {exam.scope === 'open' ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
              {exam.scope === 'open' ? 'Open to All' : (exam.course_title ?? 'Course')}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              {TYPE_ICON[exam.exam_type]}
              {exam.exam_type.toUpperCase()}
            </span>
            <span>·</span>
            <span>{exam.total_questions} questions · {exam.total_marks} marks</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePublish}
            disabled={publishing}
            className={isDraft ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : ''}
          >
            {publishing ? <Loader2 className="size-4 animate-spin" /> : isDraft ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            {isDraft ? 'Publish' : 'Unpublish'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting || hasAttempts}
            className="text-destructive hover:border-destructive/30 hover:bg-destructive/10"
            title={hasAttempts ? 'Cannot delete: exam has attempts' : 'Delete exam'}
          >
            {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-border/40 bg-muted/20 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-border/60 bg-card p-6">

        {/* ── Overview ───────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total Attempts',  value: officialAttempts.length, icon: Users,  color: 'text-blue-400' },
                { label: 'Submitted',       value: submittedAttempts.length, icon: CheckCircle2, color: 'text-emerald-400' },
                { label: 'Avg Score',       value: avgScore != null ? `${avgScore.toFixed(1)}` : '—', icon: Target, color: 'text-amber-400' },
                { label: 'Pass Rate',       value: passCount != null ? `${Math.round((passCount / submittedAttempts.length) * 100)}%` : '—', icon: Trophy, color: 'text-primary' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-lg border border-border/40 bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Icon className={cn('size-4', color)} />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Exam Info */}
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Calendar, label: 'Window Opens',   value: fmtDate(exam.window_start_at) },
                { icon: Calendar, label: 'Window Closes',  value: fmtDate(exam.window_end_at)   },
                { icon: Timer,    label: 'Duration',        value: fmtDuration(exam.individual_duration_minutes) },
                { icon: Target,   label: 'Passing Marks',  value: exam.passing_marks ? `${exam.passing_marks} / ${exam.total_marks}` : 'Not set' },
                { icon: BarChart3, label: 'Negative Marking', value: exam.negative_marking ? `${exam.negative_marking} per wrong MCQ` : 'None' },
                { icon: BookOpen, label: 'Instructions',   value: exam.instructions ? 'Set' : 'None' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 px-4 py-3">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {exam.instructions && (
              <div className="rounded-lg border border-border/40 bg-muted/10 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Instructions</p>
                <p className="text-sm whitespace-pre-wrap">{exam.instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Questions ──────────────────────────────────────────────────────── */}
        {activeTab === 'questions' && (
          <QuestionManager
            examId={exam.id}
            questions={questions}
            courses={courses}
            onSaved={setQuestions}
          />
        )}

        {/* ── Attempts ───────────────────────────────────────────────────────── */}
        {activeTab === 'attempts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Student Attempts</h2>
                <p className="text-sm text-muted-foreground">{attempts.length} total · {officialAttempts.length} official</p>
              </div>
            </div>

            {attempts.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No attempts yet.</div>
            ) : (
              <div className="rounded-lg border border-border/40 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Student</TableHead>
                      <TableHead>Roll</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">MCQ</TableHead>
                      <TableHead className="text-right">Written</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{a.users?.full_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{a.users?.student_id ?? a.users?.email ?? '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{a.roll_number ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === 'evaluated' ? 'default' : a.status === 'submitted' ? 'secondary' : 'outline'}
                            className="text-xs capitalize">
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{a.mcq_marks_obtained ?? '—'}</TableCell>
                        <TableCell className="text-right text-sm">{a.written_marks_obtained ?? '—'}</TableCell>
                        <TableCell className="text-right font-medium">{a.total_marks_obtained ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDate(a.started_at)}</TableCell>
                        <TableCell>
                          <span className={cn('text-xs', a.is_official ? 'text-foreground' : 'text-muted-foreground')}>
                            {a.is_official ? 'Official' : 'Practice'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard ────────────────────────────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab examId={exam.id} leaderboard={leaderboard} onRefresh={setLeaderboard} />
        )}

        {/* ── Settings ───────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <ExamSettingsEditor exam={exam} courses={courses} onUpdated={setExam} />
        )}
      </div>
    </div>
  );
}

// ─── Question Manager Tab ─────────────────────────────────────────────────────
function QuestionManager({
  examId, questions, courses, onSaved,
}: {
  examId: string;
  questions: ExamQuestion[];
  courses: Course[];
  onSaved: (q: ExamQuestion[]) => void;
}) {
  const [local, setLocal]             = useState(questions);
  const [saving, setSaving]           = useState(false);
  const [showPicker, setShowPicker]   = useState(false);
  const [pickerResults, setPickerRes] = useState<any[]>([]);
  const [pickerCourse, setPickerCourse] = useState('');
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerLoading, setPickerLoad]  = useState(false);
  const [saveError, setSaveError]      = useState('');

  const selectedIds = new Set(local.map((q) => q.questions.id));

  const fetchPicker = async () => {
    setPickerLoad(true);
    const params = new URLSearchParams({ limit: '100' });
    if (pickerCourse) params.set('courseId', pickerCourse);
    if (pickerSearch) params.set('subject', pickerSearch);
    const res = await fetch(`/api/admin/questions?${params}`);
    const data = await res.json();
    setPickerRes(data.questions ?? []);
    setPickerLoad(false);
  };

  const addQuestion = (q: any) => {
    if (selectedIds.has(q.id)) return;
    const newEntry: ExamQuestion = {
      id: crypto.randomUUID(),
      marks: 1,
      sequence_order: local.length + 1,
      questions: { id: q.id, content: q.content, subject: q.subject, topic: q.topic, difficulty_level: q.difficulty_level, type: q.type },
    };
    setLocal((prev) => [...prev, newEntry]);
  };

  const removeQuestion = (questionId: string) => {
    setLocal((prev) => prev.filter((q) => q.questions.id !== questionId).map((q, i) => ({ ...q, sequence_order: i + 1 })));
  };

  const move = (index: number, dir: -1 | 1) => {
    setLocal((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((q, i) => ({ ...q, sequence_order: i + 1 }));
    });
  };

  const saveQuestions = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: local.map((q, i) => ({
            questionId: q.questions.id,
            sequenceOrder: i + 1,
            marks: q.marks,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved(local);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Questions ({local.length})</h2>
          <p className="text-sm text-muted-foreground">Total: {local.reduce((s, q) => s + q.marks, 0).toFixed(1)} marks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowPicker(!showPicker); if (!showPicker) fetchPicker(); }}>
            <Plus className="size-4" /> Add Questions
          </Button>
          <Button size="sm" onClick={saveQuestions} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Save Order
          </Button>
        </div>
      </div>

      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}

      {/* Picker */}
      {showPicker && (
        <div className="rounded-lg border border-border/60 bg-muted/10 p-4 space-y-3">
          <div className="flex gap-2">
            <select value={pickerCourse} onChange={(e) => setPickerCourse(e.target.value)} className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs">
              <option value="">All Courses</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <Input className="h-8 flex-1 text-xs" placeholder="Search subject..." value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchPicker}>Search</Button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border/40 rounded-md border border-border/40">
            {pickerLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground"><Loader2 className="inline size-4 animate-spin mr-2" />Loading...</div>
            ) : pickerResults.map((q) => {
              const alreadyAdded = selectedIds.has(q.id);
              return (
                <div key={q.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm">{q.content}</p>
                    <p className="text-xs text-muted-foreground">{q.subject} · {q.difficulty_level}</p>
                  </div>
                  <Button
                    size="sm" variant={alreadyAdded ? 'ghost' : 'outline'}
                    className="h-6 shrink-0 px-2 text-xs"
                    disabled={alreadyAdded}
                    onClick={() => addQuestion(q)}
                  >
                    {alreadyAdded ? 'Added' : '+ Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question List */}
      {local.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No questions assigned yet.</div>
      ) : (
        <div className="divide-y divide-border/40 rounded-lg border border-border/40">
          {local.map((q, i) => (
            <div key={q.questions.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex shrink-0 flex-col gap-0.5">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 hover:bg-muted disabled:opacity-30">
                  <Minus className="size-3" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === local.length - 1} className="rounded p-0.5 hover:bg-muted disabled:opacity-30">
                  <Plus className="size-3" />
                </button>
              </div>
              <span className="w-6 shrink-0 text-center text-xs font-mono text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">{q.questions.content}</p>
                <div className="mt-0.5 flex gap-1.5">
                  <span className="text-xs text-muted-foreground">{q.questions.subject}</span>
                  <span className={cn('rounded px-1 text-xs', DIFF_COLORS[q.questions.difficulty_level])}>{q.questions.difficulty_level}</span>
                </div>
              </div>
              <Input
                type="number" min={0} step={0.5}
                value={q.marks}
                onChange={(e) => setLocal((prev) => prev.map((item) => item.questions.id === q.questions.id ? { ...item, marks: Number(e.target.value) } : item))}
                className="h-7 w-16 shrink-0 px-2 text-center text-xs"
              />
              <span className="text-xs text-muted-foreground">mk</span>
              <button onClick={() => removeQuestion(q.questions.id)} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────
function LeaderboardTab({
  examId, leaderboard, onRefresh,
}: {
  examId: string;
  leaderboard: LeaderboardEntry[];
  onRefresh: (l: LeaderboardEntry[]) => void;
}) {
  const [rebuilding, setRebuilding] = useState(false);

  const rebuild = async () => {
    setRebuilding(true);
    try {
      const res = await fetch(`/api/leaderboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      });
      if (res.ok) {
        const updated = await fetch(`/api/admin/exams/${examId}`).then((r) => r.json());
        onRefresh(updated.leaderboard ?? []);
      }
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">{leaderboard.length} ranked students</p>
        </div>
        <Button variant="outline" size="sm" onClick={rebuild} disabled={rebuilding}>
          {rebuilding ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Rebuild
        </Button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">No leaderboard entries yet. Submit exams first, then rebuild.</div>
      ) : (
        <div className="rounded-lg border border-border/40 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Marks</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <span className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                      entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {entry.rank}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{entry.users?.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{entry.users?.student_id ?? '—'}</p>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">{entry.total_marks}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {entry.accuracy_percent != null ? `${entry.accuracy_percent.toFixed(1)}%` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Settings Editor ──────────────────────────────────────────────────────────
function ExamSettingsEditor({
  exam, courses, onUpdated,
}: {
  exam: Exam;
  courses: Course[];
  onUpdated: (e: Exam) => void;
}) {
  const [title, setTitle]                 = useState(exam.title);
  const [description, setDescription]     = useState(exam.description ?? '');
  const [scope, setScope]                 = useState(exam.scope);
  const [courseId, setCourseId]           = useState(exam.course_id ?? '');
  const [windowStart, setWindowStart]     = useState(exam.window_start_at.slice(0, 16));
  const [windowEnd, setWindowEnd]         = useState(exam.window_end_at.slice(0, 16));
  const [duration, setDuration]           = useState(exam.individual_duration_minutes);
  const [totalMarks, setTotalMarks]       = useState(exam.total_marks);
  const [passingMarks, setPassingMarks]   = useState(exam.passing_marks?.toString() ?? '');
  const [negMarking, setNegMarking]       = useState(exam.negative_marking?.toString() ?? '0.25');
  const [shuffle, setShuffle]             = useState(exam.shuffle_questions);
  const [showAnswers, setShowAnswers]     = useState(exam.show_answers_after);
  const [instructions, setInstructions]   = useState(exam.instructions ?? '');
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);

  const negMarkingApplies = exam.exam_type === 'mcq' || exam.exam_type === 'combined';

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          scope,
          course_id: scope === 'course' ? courseId : null,
          window_start_at: new Date(windowStart).toISOString(),
          window_end_at: new Date(windowEnd).toISOString(),
          individual_duration_minutes: duration,
          total_marks: totalMarks,
          passing_marks: passingMarks ? Number(passingMarks) : null,
          negative_marking: negMarkingApplies ? Number(negMarking) : 0,
          shuffle_questions: shuffle,
          show_answers_after: showAnswers,
          instructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdated({ ...exam, ...data.exam });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold">Edit Exam Settings</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as Scope)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="course">Course-Specific</option>
            <option value="open">Open to All</option>
          </select>
        </div>

        {scope === 'course' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Course</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">— Select —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Window Start</label>
          <Input type="datetime-local" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Window End</label>
          <Input type="datetime-local" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Duration (minutes)</label>
          <Input type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Total Marks</label>
          <Input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Passing Marks</label>
          <Input type="number" min={0} value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} placeholder="Optional" />
        </div>
        {negMarkingApplies && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Negative Marking {exam.exam_type === 'combined' && <span className="text-xs text-muted-foreground">(MCQ only)</span>}</label>
            <Input type="number" min={0} step={0.25} value={negMarking} onChange={(e) => setNegMarking(e.target.value)} />
          </div>
        )}

        {[
          { id: 'edit-shuffle', label: 'Shuffle Questions', value: shuffle, setter: setShuffle },
          { id: 'edit-showanswers', label: 'Show Answers After Window', value: showAnswers, setter: setShowAnswers },
        ].map(({ id, label, value, setter }) => (
          <label key={id} htmlFor={id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/40 bg-muted/10 px-4 py-3">
            <input id={id} type="checkbox" checked={value} onChange={(e) => setter(e.target.checked)} className="size-4 accent-primary" />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}

        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-medium">Instructions</label>
          <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4" />{error}</p>
      )}
      {success && (
        <p className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="size-4" />Settings saved successfully.</p>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Save Settings
      </Button>
    </div>
  );
}

type Scope = 'course' | 'open';
