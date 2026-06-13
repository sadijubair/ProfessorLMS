'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Clock, Trophy, Settings, ListChecks, Eye,
  ChevronRight, ChevronLeft, Loader2, CheckCircle2, AlertCircle,
  Search, X, Plus, Minus, GripVertical, Globe, Lock, Zap, PenLine, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Course = { id: string; title: string };
type ExamType = 'mcq' | 'written' | 'combined';
type Scope = 'course' | 'open';

type QuestionResult = {
  id: string;
  content: string;
  subject: string;
  topic: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  type: 'mcq' | 'written' | 'short_answer';
  course_id: string;
};

type SelectedQuestion = QuestionResult & { marks: number; order: number };

const TABS = [
  { id: 'basic',     label: 'Basic',     icon: BookOpen,    desc: 'Title, scope & type'      },
  { id: 'timing',    label: 'Timing',    icon: Clock,       desc: 'Window & duration'        },
  { id: 'scoring',   label: 'Scoring',   icon: Trophy,      desc: 'Marks & penalties'        },
  { id: 'settings',  label: 'Settings',  icon: Settings,    desc: 'Options & instructions'   },
  { id: 'questions', label: 'Questions', icon: ListChecks,  desc: 'Assign question bank'     },
  { id: 'review',    label: 'Review',    icon: Eye,         desc: 'Confirm & publish'        },
] as const;

type Tab = typeof TABS[number]['id'];

const DIFF_COLORS = {
  easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hard:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export function ExamCreateForm({ courses }: { courses: Course[] }) {
  const router = useRouter();

  // ─── Tab ────────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('basic');

  // ─── Basic ──────────────────────────────────────────────────────────────────
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope]           = useState<Scope>('course');
  const [courseId, setCourseId]     = useState('');
  const [examType, setExamType]     = useState<ExamType>('mcq');

  // ─── Timing ─────────────────────────────────────────────────────────────────
  const [windowStart, setWindowStart] = useState('');
  const [windowEnd, setWindowEnd]     = useState('');
  const [duration, setDuration]       = useState(60);

  // ─── Scoring ────────────────────────────────────────────────────────────────
  const [totalMarks, setTotalMarks]     = useState(100);
  const [passingMarks, setPassingMarks] = useState<string>('');
  const [negMarking, setNegMarking]     = useState('0.25');

  // ─── Settings ───────────────────────────────────────────────────────────────
  const [shuffle, setShuffle]           = useState(false);
  const [showAnswers, setShowAnswers]   = useState(true);
  const [instructions, setInstructions] = useState('');

  // ─── Questions ──────────────────────────────────────────────────────────────
  const [selectedQs, setSelectedQs]       = useState<SelectedQuestion[]>([]);
  const [qSearch, setQSearch]             = useState('');
  const [qCourseFilter, setQCourseFilter] = useState('');
  const [qResults, setQResults]           = useState<QuestionResult[]>([]);
  const [qLoading, setQLoading]           = useState(false);

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Auto-set course filter when scope = course
  useEffect(() => {
    if (scope === 'course' && courseId) setQCourseFilter(courseId);
    if (scope === 'open') setQCourseFilter('');
  }, [scope, courseId]);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    setQLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (qCourseFilter) params.set('courseId', qCourseFilter);
      if (qSearch) params.set('subject', qSearch);
      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json();
      setQResults(data.questions ?? []);
    } catch {
      setQResults([]);
    } finally {
      setQLoading(false);
    }
  }, [qCourseFilter, qSearch]);

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestions();
  }, [activeTab, fetchQuestions]);

  const toggleQuestion = (q: QuestionResult) => {
    setSelectedQs((prev) => {
      const exists = prev.find((s) => s.id === q.id);
      if (exists) return prev.filter((s) => s.id !== q.id);
      const perQ = totalMarks > 0 ? Math.round((totalMarks / (prev.length + 1)) * 100) / 100 : 1;
      return [...prev, { ...q, marks: perQ, order: prev.length + 1 }];
    });
  };

  const moveQ = (index: number, dir: -1 | 1) => {
    setSelectedQs((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((q, i) => ({ ...q, order: i + 1 }));
    });
  };

  const updateMarks = (id: string, marks: number) => {
    setSelectedQs((prev) => prev.map((q) => (q.id === id ? { ...q, marks } : q)));
  };

  // Min rule preview
  const minRulePreview = () => {
    if (!windowStart || !windowEnd || !duration) return null;
    const start = new Date(windowStart);
    const end = new Date(windowEnd);
    const windowMins = Math.round((end.getTime() - start.getTime()) / 60000);
    if (windowMins <= 0) return null;
    const effectiveMins = Math.min(duration, windowMins);
    return { windowMins, effectiveMins };
  };

  const negMarkingApplies = examType === 'mcq' || examType === 'combined';

  const handleSubmit = async (publish: boolean) => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        courseId: scope === 'course' ? courseId : null,
        scope,
        title,
        description,
        examType,
        totalMarks,
        passingMarks: passingMarks ? Number(passingMarks) : undefined,
        negativeMarking: negMarkingApplies ? Number(negMarking) : 0,
        windowStartAt: new Date(windowStart).toISOString(),
        windowEndAt: new Date(windowEnd).toISOString(),
        individualDurationMinutes: duration,
        shuffleQuestions: shuffle,
        showAnswersAfter: showAnswers,
        instructions,
        questionIds: selectedQs.map((q) => q.id),
        publishNow: publish,
      };

      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create exam');

      // Save questions with marks & order
      if (selectedQs.length > 0) {
        await fetch(`/api/admin/exams/${data.exam.id}/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: selectedQs.map((q, i) => ({
              questionId: q.id,
              sequenceOrder: i + 1,
              marks: q.marks,
            })),
          }),
        });
      }

      router.push(`/admin/exams/${data.exam.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:block">{tab.label}</span>
              <span className="block sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-border/60 bg-card p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <p className="text-sm text-muted-foreground">Set the exam title, type, and who can access it.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Exam Title <span className="text-destructive">*</span></label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. BCS Prelim Mock Exam #3" />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the exam..." rows={3} />
              </div>

              {/* Scope Selector */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Exam Scope <span className="text-destructive">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'course', icon: Lock, label: 'Course-Specific', desc: 'Only enrolled students of the selected course' },
                    { value: 'open', icon: Globe, label: 'Open to All', desc: 'Any registered student on the platform' },
                  ] as const).map(({ value, icon: Icon, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setScope(value)}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-4 text-left transition-all',
                        scope === value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-border/80 hover:bg-muted/30'
                      )}
                    >
                      <div className={cn('mt-0.5 rounded-md p-1.5', scope === value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Course Picker (only for course-scoped) */}
              {scope === 'course' && (
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium">Course <span className="text-destructive">*</span></label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Select a course —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Exam Type */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Exam Type <span className="text-destructive">*</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'mcq',      icon: BarChart3, label: 'MCQ',      desc: 'Multiple choice with negative marking' },
                    { value: 'written',  icon: PenLine,   label: 'Written',  desc: 'Written answers, manual grading' },
                    { value: 'combined', icon: Zap,       label: 'Combined', desc: 'MCQ + Written (MCQ has negative marking)' },
                  ] as const).map(({ value, icon: Icon, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setExamType(value)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all',
                        examType === value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-border/80 hover:bg-muted/30'
                      )}
                    >
                      <div className={cn('rounded-md p-1.5', examType === value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Exam Window & Duration</h2>
              <p className="text-sm text-muted-foreground">The global window defines when students can start. Each student gets their own timer.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Window Start <span className="text-destructive">*</span></label>
                <Input type="datetime-local" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Window End <span className="text-destructive">*</span></label>
                <Input type="datetime-local" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Individual Duration (minutes) <span className="text-destructive">*</span></label>
                <Input type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
            </div>

            {/* MIN rule preview */}
            {(() => {
              const preview = minRulePreview();
              if (!preview) return null;
              return (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
                  <p className="text-sm font-medium text-amber-400 flex items-center gap-2">
                    <Clock className="size-4" /> Timer Rule Preview (MIN rule)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total window: <span className="font-medium text-foreground">{preview.windowMins} min</span> · Individual duration: <span className="font-medium text-foreground">{duration} min</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    A student who starts <strong>at the beginning</strong> gets <span className="font-semibold text-amber-400">{preview.effectiveMins} min</span>.
                    A student who starts <strong>30 min before window closes</strong> gets only <span className="font-semibold text-amber-400">{Math.min(duration, 30)} min</span>.
                  </p>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Marks & Scoring</h2>
              <p className="text-sm text-muted-foreground">Configure the marking scheme for this exam.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Total Marks <span className="text-destructive">*</span></label>
                <Input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Passing Marks</label>
                <Input type="number" min={0} value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} placeholder="Optional" />
              </div>
              {negMarkingApplies ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Negative Marking
                    {examType === 'combined' && <span className="ml-1 text-xs text-muted-foreground">(MCQ portion only)</span>}
                  </label>
                  <Input type="number" min={0} step={0.25} value={negMarking} onChange={(e) => setNegMarking(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Marks deducted per wrong MCQ answer (e.g. 0.25)</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Negative Marking</label>
                  <div className="flex h-10 items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                    Not applicable for Written exams
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Exam Settings</h2>
              <p className="text-sm text-muted-foreground">Configure question order and post-exam behavior.</p>
            </div>
            <div className="space-y-4">
              {[
                { id: 'shuffle', label: 'Shuffle Questions', desc: 'Randomize question order for each student', value: shuffle, setter: setShuffle },
                { id: 'showanswers', label: 'Show Answers After Window Closes', desc: 'Students can review correct answers once the window ends', value: showAnswers, setter: setShowAnswers },
              ].map(({ id, label, desc, value, setter }) => (
                <label key={id} htmlFor={id} className="flex cursor-pointer items-start gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 hover:bg-muted/30 transition-colors">
                  <div className="relative mt-0.5">
                    <input
                      id={id}
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setter(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className={cn(
                      'h-5 w-9 rounded-full transition-colors',
                      value ? 'bg-primary' : 'bg-muted-foreground/30'
                    )}>
                      <div className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                        value ? 'translate-x-4' : 'translate-x-0.5'
                      )} />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Instructions for Students</label>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Any special instructions, rules, or information students should read before starting..."
                  rows={5}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Assign Questions</h2>
                <p className="text-sm text-muted-foreground">Pick from the question bank. Drag to reorder.</p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {selectedQs.length} selected · {selectedQs.reduce((s, q) => s + q.marks, 0).toFixed(1)} marks
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Question Browser */}
              <div className="rounded-lg border border-border/60 bg-muted/10">
                <div className="border-b border-border/60 p-3 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8 h-8 text-sm"
                      placeholder="Search by subject..."
                      value={qSearch}
                      onChange={(e) => setQSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={qCourseFilter}
                      onChange={(e) => setQCourseFilter(e.target.value)}
                      className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="">All Courses</option>
                      {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={fetchQuestions}>
                      Search
                    </Button>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
                  {qLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
                      <Loader2 className="size-4 animate-spin" /> Loading...
                    </div>
                  ) : qResults.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">No questions found</div>
                  ) : qResults.map((q) => {
                    const isSelected = selectedQs.some((s) => s.id === q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => toggleQuestion(q)}
                        className={cn(
                          'flex w-full items-start gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/30',
                          isSelected && 'bg-primary/5'
                        )}
                      >
                        <div className={cn(
                          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                        )}>
                          {isSelected && <CheckCircle2 className="size-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-medium leading-snug">{q.content}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {q.subject && <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{q.subject}</span>}
                            <span className={cn('rounded border px-1.5 py-0.5 text-xs', DIFF_COLORS[q.difficulty_level])}>{q.difficulty_level}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground uppercase">{q.type}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Questions */}
              <div className="rounded-lg border border-border/60 bg-muted/10">
                <div className="border-b border-border/60 px-3 py-2.5">
                  <p className="text-sm font-medium">Selected Questions ({selectedQs.length})</p>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-border/40">
                  {selectedQs.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      Select questions from the left panel
                    </div>
                  ) : selectedQs.map((q, i) => (
                    <div key={q.id} className="flex items-center gap-2 px-3 py-2.5">
                      <div className="flex shrink-0 flex-col gap-0.5">
                        <button onClick={() => moveQ(i, -1)} disabled={i === 0} className="rounded p-0.5 hover:bg-muted disabled:opacity-30">
                          <Minus className="size-3" />
                        </button>
                        <button onClick={() => moveQ(i, 1)} disabled={i === selectedQs.length - 1} className="rounded p-0.5 hover:bg-muted disabled:opacity-30">
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">{i + 1}</span>
                      <p className="min-w-0 flex-1 line-clamp-1 text-xs">{q.content}</p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          value={q.marks}
                          onChange={(e) => updateMarks(q.id, Number(e.target.value))}
                          className="h-6 w-14 px-1.5 text-center text-xs"
                        />
                        <span className="text-xs text-muted-foreground">mk</span>
                        <button onClick={() => toggleQuestion(q)} className="rounded p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Review & Publish</h2>
              <p className="text-sm text-muted-foreground">Confirm your exam settings before saving.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: 'Title', value: title || '—' },
                { label: 'Scope', value: scope === 'open' ? 'Open to All' : `Course: ${courses.find(c => c.id === courseId)?.title ?? '—'}` },
                { label: 'Type', value: examType.toUpperCase() },
                { label: 'Window Start', value: windowStart ? new Date(windowStart).toLocaleString() : '—' },
                { label: 'Window End', value: windowEnd ? new Date(windowEnd).toLocaleString() : '—' },
                { label: 'Duration', value: `${duration} minutes` },
                { label: 'Total Marks', value: totalMarks },
                { label: 'Passing Marks', value: passingMarks || 'Not set' },
                { label: 'Negative Marking', value: negMarkingApplies ? `${negMarking} per wrong` : 'N/A' },
                { label: 'Questions', value: `${selectedQs.length} questions` },
                { label: 'Shuffle', value: shuffle ? 'Yes' : 'No' },
                { label: 'Show Answers After', value: showAnswers ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">{String(value)}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleSubmit(false)}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Save as Draft
              </Button>
              <Button
                className="flex-1 bg-primary"
                onClick={() => handleSubmit(true)}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Publish Now
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setActiveTab(TABS[tabIndex - 1]?.id ?? 'basic')}
          disabled={tabIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <div className="flex gap-1">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                activeTab === tab.id ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
        <Button
          onClick={() => setActiveTab(TABS[tabIndex + 1]?.id ?? 'review')}
          disabled={tabIndex === TABS.length - 1}
          className="gap-2"
        >
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
