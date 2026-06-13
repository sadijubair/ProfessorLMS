'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe, Lock, Zap, PenLine, BarChart3,
  Calendar, Timer, BookOpen, MoreHorizontal,
  Search, Eye, Settings, Trash2, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type WindowState = 'upcoming' | 'live' | 'closed';
type Exam = {
  id: string;
  title: string;
  scope: 'course' | 'open';
  course_title: string | null;
  exam_type: 'mcq' | 'written' | 'combined';
  total_questions: number;
  total_marks: number;
  window_start_at: string;
  window_end_at: string;
  individual_duration_minutes: number;
  published_at: string | null;
  window_state: WindowState;
};

type Course = { id: string; title: string };

const STATUS_CONFIG: Record<WindowState | 'draft', { label: string; cls: string }> = {
  draft:    { label: 'Draft',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'       },
  upcoming: { label: 'Upcoming', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20'          },
  live:     { label: 'Live',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  closed:   { label: 'Closed',   cls: 'bg-muted text-muted-foreground'                           },
};

const TYPE_CONFIG = {
  mcq:      { icon: BarChart3, label: 'MCQ',      cls: 'bg-blue-500/10 text-blue-400'    },
  written:  { icon: PenLine,   label: 'Written',  cls: 'bg-violet-500/10 text-violet-400' },
  combined: { icon: Zap,       label: 'Combined', cls: 'bg-amber-500/10 text-amber-400'  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ExamListClient({ exams, courses }: { exams: Exam[]; courses: Course[] }) {
  const [search, setSearch]     = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'course' | 'open'>('all');
  const [typeFilter, setTypeFilter]   = useState<'all' | 'mcq' | 'written' | 'combined'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'upcoming' | 'live' | 'closed'>('all');

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (scopeFilter !== 'all' && e.scope !== scopeFilter) return false;
      if (typeFilter !== 'all' && e.exam_type !== typeFilter) return false;
      const effectiveStatus = !e.published_at ? 'draft' : e.window_state;
      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false;
      return true;
    });
  }, [exams, search, scopeFilter, typeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search exams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {(['all', 'course', 'open'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setScopeFilter(v)}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-colors capitalize',
              scopeFilter === v
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            )}
          >
            {v === 'all' ? 'All Scopes' : v === 'course' ? 'Course-Specific' : 'Open to All'}
          </button>
        ))}

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="written">Written</option>
          <option value="combined">Combined</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {exams.length} exams
      </p>

      {/* Exam Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-20 text-center">
          <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-muted-foreground">No exams match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((exam) => {
            const effectiveStatus = !exam.published_at ? 'draft' : exam.window_state;
            const statusCfg = STATUS_CONFIG[effectiveStatus];
            const typeCfg = TYPE_CONFIG[exam.exam_type];
            const TypeIcon = typeCfg.icon;

            return (
              <div
                key={exam.id}
                className="group relative flex flex-col rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-border hover:shadow-md"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', statusCfg.cls)}>
                      {statusCfg.label}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', typeCfg.cls)}>
                      <TypeIcon className="size-3" />
                      {typeCfg.label}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                    {exam.scope === 'open' ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
                    {exam.scope === 'open' ? 'Open' : 'Course'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-3 font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {exam.title}
                </h3>

                {/* Course */}
                {exam.scope === 'course' && exam.course_title && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{exam.course_title}</p>
                )}

                {/* Meta */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 shrink-0" />
                    <span>{fmtDate(exam.window_start_at)} → {fmtDate(exam.window_end_at)}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Timer className="size-3.5" />{exam.individual_duration_minutes}m</span>
                    <span className="flex items-center gap-1"><BookOpen className="size-3.5" />{exam.total_questions} questions</span>
                    <span className="flex items-center gap-1"><BarChart3 className="size-3.5" />{exam.total_marks} marks</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2 border-t border-border/40 pt-4">
                  <Button asChild size="sm" variant="secondary" className="flex-1 gap-1.5">
                    <Link href={`/admin/exams/${exam.id}`}>
                      <Eye className="size-3.5" /> View
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="flex-1 gap-1.5">
                    <Link href={`/admin/exams/${exam.id}?tab=settings`}>
                      <Settings className="size-3.5" /> Edit
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
