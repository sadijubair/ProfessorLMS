'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Settings2,
  CircleDollarSign,
  LayoutList,
  Plus,
  Trash2,
  CheckCircle2,
  Tag,
  Clock,
  Users,
  Zap,
  FileText,
  MessageCircle,
  Globe,
  AlertCircle,
  Loader2,
  ImageIcon,
  Check,
  Save,
  ArrowLeft,
  Image,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Radio,
  Percent,
  BookMarked,
  ExternalLink,
  Play,
  PenLine,
  AlignLeft,
  Link2,
  Link as LinkIcon,
  UserCog,
  Search,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TiptapEditor } from '@/components/admin/tiptap-editor';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COURSE_CURRICULUM_SUGGESTIONS } from '@/lib/course-curriculum';

// ─── Types ───────────────────────────────────────────────────────────────────

type CourseType   = 'premium-guided' | 'self-paced' | 'free';
type PricingType  = 'paid' | 'free';
type DiscountType = 'flat' | 'percentile';
type ExpiryPeriod = 'lifetime' | 'limited';
type CourseStatus = 'active' | 'private' | 'upcoming' | 'pending' | 'draft' | 'inactive';
type Tab = 'basic' | 'media' | 'pricing' | 'features' | 'curriculum' | 'instructor' | 'settings';

// 3-level hierarchy: Section → Subsection → Lessons
type LessonType = 'video' | 'pdf' | 'exam' | 'link' | 'text';
interface CurriculumLesson { title: string; type: LessonType; url?: string }
interface CurriculumSubsection { title: string; items: CurriculumLesson[] }
interface CurriculumSection    { title: string; subsections: CurriculumSubsection[] }

const LESSON_TYPES: { value: LessonType; label: string; icon: React.ElementType; placeholder: string; color: string }[] = [
  { value: 'video', label: 'Video',  icon: Play,      placeholder: 'https://youtube.com/... or video URL', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800' },
  { value: 'pdf',   label: 'PDF',    icon: FileText,  placeholder: 'https://... PDF file URL',             color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'   },
  { value: 'exam',  label: 'Exam',   icon: PenLine,   placeholder: 'Exam link, slug, or ID',               color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  { value: 'link',  label: 'Link',   icon: LinkIcon,  placeholder: 'https://... any external URL',         color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800' },
  { value: 'text',  label: 'Text',   icon: AlignLeft, placeholder: '',                                     color: 'text-zinc-600 bg-zinc-50 border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700' },
];

export interface CourseRow {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category: string;
  pricing_type: 'paid' | 'free' | null;
  price_bdt: number;
  is_free: boolean;
  is_self_paced: boolean;
  has_support: boolean;
  has_facebook_group: boolean;
  has_google_classroom: boolean;
  has_live_exam: boolean;
  has_written_exam: boolean;
  promo_code: string | null;
  discount_type: string | null;
  discount_value_bdt: number | null;
  expiry_period: string | null;
  expiry_months: number | null;
  course_status: string | null;
  thumbnail_url: string | null;
  max_students: number | null;
  duration_days: number | null;
  curriculum_sections: unknown;
  published_at: string | null;
  requires_manual_payment: boolean;
  page_sections?: unknown;
  created_at: string;
  updated_at: string;
  teacher_id: string | null;
}

export interface TeacherRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Migrate from old formats to current CurriculumSection[] */
function parseSections(raw: unknown): CurriculumSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s): CurriculumSection => {
    if (typeof s !== 'object' || s === null) return { title: '', subsections: [] };
    const obj = s as Record<string, unknown>;
    const title = String(obj.title ?? '');

    function parseLesson(raw: unknown): CurriculumLesson {
      if (typeof raw === 'string') return { title: raw, type: 'video', url: '' };
      if (typeof raw === 'object' && raw !== null) {
        const o = raw as Record<string, unknown>;
        const type = (['video','pdf','exam','link','text'] as LessonType[]).includes(o.type as LessonType)
          ? (o.type as LessonType) : 'video';
        return { title: String(o.title ?? ''), type, url: String(o.url ?? '') };
      }
      return { title: '', type: 'video', url: '' };
    }

    // New format: subsections[]
    if (Array.isArray(obj.subsections)) {
      return {
        title,
        subsections: (obj.subsections as unknown[]).map((sub): CurriculumSubsection => {
          if (typeof sub !== 'object' || sub === null) return { title: '', items: [] };
          const o = sub as Record<string, unknown>;
          return {
            title: String(o.title ?? ''),
            items: Array.isArray(o.items) ? (o.items as unknown[]).map(parseLesson) : [],
          };
        }),
      };
    }
    // Old flat format: items[] directly on section
    if (Array.isArray(obj.items) && obj.items.length > 0) {
      return { title, subsections: [{ title: 'General', items: (obj.items as unknown[]).map(parseLesson) }] };
    }
    return { title, subsections: [] };
  });
}

function totalItems(s: CurriculumSection) {
  return s.subsections.reduce((n, sub) => n + sub.items.length, 0);
}

function deriveCourseType(c: CourseRow): CourseType {
  if (c.is_free || c.pricing_type === 'free') return 'free';
  if (c.is_self_paced) return 'self-paced';
  return 'premium-guided';
}

// ─── Small primitives ─────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
      {children}{required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-muted-foreground">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-6 text-lg font-semibold tracking-tight">{children}</h2>;
}

function Divider() {
  return <hr className="my-6 border-border" />;
}

// ─── Feature Toggle ───────────────────────────────────────────────────────────

function FeatureToggle({ icon: Icon, label, description, checked, onChange, id }: {
  icon: React.ElementType; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void; id: string;
}) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${checked ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border hover:bg-muted/40'}`}>
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-1 shrink-0" />
    </label>
  );
}

// ─── Curriculum: Subsection Card ─────────────────────────────────────────────

function SubsectionCard({ subsection, onUpdate, onRemove }: {
  subsection: CurriculumSubsection;
  onUpdate: (updated: CurriculumSubsection) => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed]       = useState(false);
  const [editingTitle, setEditingTitle] = useState(!subsection.title);
  const [localTitle, setLocalTitle]     = useState(subsection.title);
  const [newItem, setNewItem]           = useState('');
  const [newItemType, setNewItemType]   = useState<LessonType>('video');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [draftLesson, setDraftLesson]   = useState<CurriculumLesson | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  function commitTitle() {
    setEditingTitle(false);
    onUpdate({ ...subsection, title: localTitle });
  }

  function commitNewItem() {
    if (!newItem.trim()) return;
    const lesson: CurriculumLesson = { title: newItem.trim(), type: newItemType, url: '' };
    const items = [...subsection.items, lesson];
    onUpdate({ ...subsection, items });
    // Immediately expand the new item for URL entry
    setExpandedItem(items.length - 1);
    setDraftLesson({ ...lesson });
    setNewItem('');
  }

  function openExpand(ii: number) {
    setExpandedItem(ii);
    setDraftLesson({ ...subsection.items[ii] });
  }

  function commitDraft(ii: number) {
    if (!draftLesson) return;
    if (draftLesson.title.trim()) {
      const items = [...subsection.items]; items[ii] = { ...draftLesson, title: draftLesson.title.trim() };
      onUpdate({ ...subsection, items });
    }
    setExpandedItem(null); setDraftLesson(null);
  }

  function moveItem(from: number, to: number) {
    const items = [...subsection.items];
    const [m] = items.splice(from, 1); items.splice(to, 0, m);
    onUpdate({ ...subsection, items });
  }

  function removeItem(ii: number) {
    if (expandedItem === ii) { setExpandedItem(null); setDraftLesson(null); }
    onUpdate({ ...subsection, items: subsection.items.filter((_, i) => i !== ii) });
  }

  const lessonIcon = (type: LessonType, className = 'h-3 w-3') => {
    const cfg = LESSON_TYPES.find(t => t.value === type)!;
    const Icon = cfg.icon;
    return <Icon className={className} />;
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {/* Subsection header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setCollapsed(c => !c)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`} />
        </button>
        {editingTitle ? (
          <Input autoFocus value={localTitle} onChange={e => setLocalTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setLocalTitle(subsection.title); setEditingTitle(false); } }}
            className="h-6 flex-1 border-0 bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0"
            placeholder="Subsection title…" />
        ) : (
          <button type="button" onClick={() => { setEditingTitle(true); setLocalTitle(subsection.title); }}
            className="flex-1 text-left text-sm font-semibold hover:text-primary transition-colors">
            {subsection.title || <span className="italic font-normal text-muted-foreground text-xs">Untitled — click to name</span>}
          </button>
        )}
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {subsection.items.length} {subsection.items.length === 1 ? 'item' : 'items'}
        </span>
        <button type="button" onClick={onRemove}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors" title="Delete subsection">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="border-t">
          {subsection.items.length === 0 && (
            <p className="px-10 py-3 text-xs italic text-muted-foreground">No lessons yet — add below</p>
          )}
          {subsection.items.map((item, ii) => {
            const typeInfo = LESSON_TYPES.find(t => t.value === item.type) ?? LESSON_TYPES[0];
            const TypeIcon = typeInfo.icon;
            const isOpen = expandedItem === ii;

            return (
              <div key={ii} className="border-b last:border-b-0">
                {isOpen && draftLesson ? (
                  /* ── EXPANDED EDIT FORM ── */
                  <div className="bg-muted/20 px-4 py-3 space-y-3">
                    {/* Type selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {LESSON_TYPES.map(t => {
                        const TIcon = t.icon;
                        const active = draftLesson.type === t.value;
                        return (
                          <button key={t.value} type="button"
                            onClick={() => setDraftLesson(d => ({ ...d!, type: t.value }))}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                              active ? t.color + ' border-current' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                            }`}>
                            <TIcon className="h-3 w-3" />{t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Title */}
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Lesson Title</label>
                      <Input value={draftLesson.title} onChange={e => setDraftLesson(d => ({ ...d!, title: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') commitDraft(ii); if (e.key === 'Escape') { setExpandedItem(null); setDraftLesson(null); } }}
                        className="h-8 text-sm" placeholder="Lesson title…" autoFocus />
                    </div>

                    {/* URL (only for video / pdf / exam) */}
                    {draftLesson.type !== 'text' && (
                      <div>
                        <label className="mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                          <Link2 className="h-3 w-3" />
                          {draftLesson.type === 'video' ? 'Video URL'
                            : draftLesson.type === 'pdf' ? 'PDF File URL'
                            : draftLesson.type === 'exam' ? 'Exam Link / ID'
                            : 'External URL'}
                        </label>
                        <Input value={draftLesson.url ?? ''}
                          onChange={e => setDraftLesson(d => ({ ...d!, url: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') commitDraft(ii); }}
                          className="h-8 font-mono text-xs"
                          placeholder={typeInfo.placeholder} />
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setExpandedItem(null); setDraftLesson(null); }}
                        className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                      <button type="button" onClick={() => commitDraft(ii)}
                        className="flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                        <Check className="h-3 w-3" /> Done
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── COLLAPSED ROW ── */
                  <div className="group flex cursor-pointer items-start gap-2 pl-9 pr-3 py-2 hover:bg-muted/20 transition-colors"
                    onClick={() => openExpand(ii)}>
                    {/* Type badge */}
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${typeInfo.color}`}>
                      <TypeIcon className="h-2.5 w-2.5" />
                    </span>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{item.title}</p>
                      {item.url && (
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">{item.url}</p>
                      )}
                    </div>
                    {/* Row actions */}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                      <button type="button" disabled={ii === 0} onClick={() => moveItem(ii, ii - 1)}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button type="button" disabled={ii === subsection.items.length - 1} onClick={() => moveItem(ii, ii + 1)}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => removeItem(ii)}
                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add lesson row */}
          <div className="flex items-center gap-2 bg-muted/10 pl-4 pr-4 py-2">
            {/* Quick type toggle */}
            <div className="flex shrink-0 gap-0.5">
              {LESSON_TYPES.map(t => {
                const TIcon = t.icon;
                const active = newItemType === t.value;
                return (
                  <button key={t.value} type="button" title={t.label}
                    onClick={() => setNewItemType(t.value)}
                    className={`flex h-6 w-6 items-center justify-center rounded transition-all ${
                      active ? `${t.color} border` : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    <TIcon className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
            <span className="text-muted-foreground/30 text-xs">|</span>
            <input ref={addInputRef} type="text" value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitNewItem(); } }}
              placeholder="Add lesson title… press Enter"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40" />
            {newItem.trim() && (
              <button type="button" onClick={commitNewItem}
                className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors">
                Add
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Curriculum: Section Card ─────────────────────────────────────────────────

function SectionCard({ section, onUpdate, onRemove }: {
  section: CurriculumSection;
  onUpdate: (updated: CurriculumSection) => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed]       = useState(false);
  const [editingTitle, setEditingTitle] = useState(!section.title);
  const [localTitle, setLocalTitle]     = useState(section.title);

  function commitTitle() {
    setEditingTitle(false);
    onUpdate({ ...section, title: localTitle });
  }
  function updateSub(si: number, updated: CurriculumSubsection) {
    const subsections = [...section.subsections]; subsections[si] = updated;
    onUpdate({ ...section, subsections });
  }
  function removeSub(si: number) {
    onUpdate({ ...section, subsections: section.subsections.filter((_, i) => i !== si) });
  }

  const total = totalItems(section);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Section header */}
      <div className="flex items-center gap-3 bg-muted/40 px-4 py-3">
        <button type="button" onClick={() => setCollapsed(c => !c)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${collapsed ? '' : 'rotate-90'}`} />
        </button>
        {editingTitle ? (
          <Input autoFocus value={localTitle} onChange={e => setLocalTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setLocalTitle(section.title); setEditingTitle(false); } }}
            className="h-7 flex-1 border-0 bg-transparent p-0 text-base font-bold shadow-none focus-visible:ring-0"
            placeholder="Section title…" />
        ) : (
          <button type="button" onClick={() => { setEditingTitle(true); setLocalTitle(section.title); }}
            className="flex-1 text-left text-base font-bold hover:text-primary transition-colors">
            {section.title || <span className="italic font-normal text-sm text-muted-foreground">Untitled section — click to name</span>}
          </button>
        )}
        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {total} {total === 1 ? 'item' : 'items'}
        </span>
        <button type="button" onClick={onRemove}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete section">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Subsections */}
      {!collapsed && (
        <div className="p-4 space-y-3">
          {section.subsections.length === 0 && (
            <p className="py-3 text-center text-xs italic text-muted-foreground">
              No subsections yet — click “Add Subsection” below
            </p>
          )}
          {section.subsections.map((sub, si) => (
            <SubsectionCard key={si} subsection={sub}
              onUpdate={updated => updateSub(si, updated)}
              onRemove={() => removeSub(si)} />
          ))}
          <button type="button"
            onClick={() => onUpdate({ ...section, subsections: [...section.subsections, { title: '', items: [] }] })}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all">
            <Plus className="h-3.5 w-3.5" /> Add Subsection
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Curriculum Builder ───────────────────────────────────────────────────────

function CurriculumBuilder({ sections, onChange }: {
  sections: CurriculumSection[]; onChange: (s: CurriculumSection[]) => void;
}) {
  function update(i: number, updated: CurriculumSection) {
    const next = [...sections]; next[i] = updated; onChange(next);
  }
  return (
    <div className="space-y-4">
      {sections.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-sm font-medium text-muted-foreground">No sections yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Click "Add Section" to start building the curriculum</p>
        </div>
      )}
      {sections.map((section, si) => (
        <SectionCard key={si} section={section}
          onUpdate={updated => update(si, updated)}
          onRemove={() => onChange(sections.filter((_, i) => i !== si))} />
      ))}
      <button type="button"
        onClick={() => onChange([...sections, { title: '', subsections: [] }])}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all">
        <Plus className="h-4 w-4" /> Add Section
      </button>
    </div>
  );
}


// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'basic',      label: 'Basic',       icon: BookOpen,         description: 'Title, description & category' },
  { id: 'media',      label: 'Media',       icon: Image,            description: 'Thumbnail & cover image'        },
  { id: 'pricing',    label: 'Pricing',     icon: CircleDollarSign, description: 'Price, discount & validity'     },
  { id: 'features',   label: 'Features',    icon: Zap,              description: 'Exams, support & community'    },
  { id: 'curriculum', label: 'Curriculum',  icon: LayoutList,       description: 'Course content structure'       },
  { id: 'instructor', label: 'Instructor',  icon: UserCog,          description: 'Assign course instructor'       },
  { id: 'settings',   label: 'Settings',    icon: Settings2,        description: 'Status, capacity & duration'   },
];

const STATUS_OPTS: { value: CourseStatus; label: string; desc: string; color: string }[] = [
  { value: 'draft',    label: 'Draft',    desc: 'Saved but not visible to students',     color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
  { value: 'active',   label: 'Active',   desc: 'Publicly listed and enrollable',        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400' },
  { value: 'upcoming', label: 'Upcoming', desc: 'Visible but enrollment not open yet',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-400' },
  { value: 'private',  label: 'Private',  desc: 'Hidden — accessible via direct link',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400' },
  { value: 'pending',  label: 'Pending',  desc: 'Awaiting admin review',                 color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-400' },
  { value: 'inactive', label: 'Inactive', desc: 'Disabled and archived',                 color: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-400' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function CourseEditForm({
  course,
  categories,
  teachers = [],
  instructorIds = [],
}: {
  course: CourseRow;
  categories: string[];
  teachers?: TeacherRow[];
  instructorIds?: string[];
}) {
  const router = useRouter();

  // UI state
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Basic
  const [title, setTitle]                   = useState(course.title);
  const [shortDescription, setShortDesc]    = useState(course.short_description ?? '');
  const [description, setDescription]       = useState(course.description ?? '');
  const [category, setCategory]             = useState(course.category);
  const [courseType, setCourseType]         = useState<CourseType>(deriveCourseType(course));

  // Media
  const [thumbnailUrl, setThumbnailUrl]     = useState(course.thumbnail_url ?? '');

  // Pricing
  const [pricingType, setPricingType]       = useState<PricingType>((course.pricing_type as PricingType) ?? (course.is_free ? 'free' : 'paid'));
  const [priceBdt, setPriceBdt]             = useState(String(course.price_bdt ?? 0));
  const [promoCode, setPromoCode]           = useState(course.promo_code ?? '');
  const [discountType, setDiscountType]     = useState<DiscountType>((course.discount_type as DiscountType) ?? 'flat');
  const [flatDiscount, setFlatDiscount]     = useState(course.discount_value_bdt ? String(course.discount_value_bdt) : '');
  const [discountPct, setDiscountPct]       = useState('0');
  const [expiryPeriod, setExpiryPeriod]     = useState<ExpiryPeriod>((course.expiry_period as ExpiryPeriod) ?? 'lifetime');
  const [expiryMonths, setExpiryMonths]     = useState(course.expiry_months ? String(course.expiry_months) : '');

  // Features
  const [hasSupport, setHasSupport]                 = useState(course.has_support);
  const [hasFacebook, setHasFacebook]               = useState(course.has_facebook_group);
  const [hasClassroom, setHasClassroom]             = useState(course.has_google_classroom);
  const [hasLiveExam, setHasLiveExam]               = useState(course.has_live_exam);
  const [hasWrittenExam, setHasWrittenExam]         = useState(course.has_written_exam);

  // Settings
  const [courseStatus, setCourseStatus]     = useState<CourseStatus>((course.course_status as CourseStatus) ?? 'draft');
  const [durationDays, setDurationDays]     = useState(course.duration_days ? String(course.duration_days) : '');
  const [maxStudents, setMaxStudents]       = useState(course.max_students ? String(course.max_students) : '');

  // Curriculum
  const [sections, setSections]             = useState<CurriculumSection[]>(parseSections(course.curriculum_sections));

  // Instructor (multi)
  const [teacherIds, setTeacherIds]         = useState<string[]>(instructorIds);
  const [teacherSearch, setTeacherSearch]   = useState('');

  const isFree = pricingType === 'free' || courseType === 'free';
  const isSelfPaced = courseType === 'self-paced';
  const allCategories = categories.length ? categories : ['BCS', 'Bank', 'Admission', 'Academic', 'Skill'];

  const computedDiscount = useMemo(() => {
    if (isFree) return 0;
    const base = Number(priceBdt) || 0;
    if (discountType === 'percentile') {
      return Math.max(0, Math.round(base - (base * (Number(discountPct) || 0)) / 100));
    }
    return Math.max(0, Math.round(Number(flatDiscount) || 0));
  }, [isFree, priceBdt, discountType, discountPct, flatDiscount]);

  const currentStatus = STATUS_OPTS.find(s => s.value === courseStatus);

  async function save() {
    setSubmitting(true);
    setErrorMsg(null);
    setSaved(false);

    const payload: Record<string, unknown> = {
      title,
      short_description: shortDescription || null,
      description: description || null,
      category,
      pricing_type: isFree ? 'free' : 'paid',
      price_bdt: isFree ? 0 : Number(priceBdt) || 0,
      is_free: isFree,
      is_self_paced: isSelfPaced,
      has_support: hasSupport,
      has_facebook_group: hasFacebook,
      has_google_classroom: hasClassroom,
      has_live_exam: hasLiveExam,
      has_written_exam: hasWrittenExam,
      requires_manual_payment: !isFree,
      promo_code: promoCode || null,
      discount_type: discountType,
      discount_value_bdt: isFree ? null : (computedDiscount || null),
      expiry_period: expiryPeriod,
      expiry_months: expiryMonths ? Number(expiryMonths) : null,
      course_status: courseStatus,
      thumbnail_url: thumbnailUrl || null,
      max_students: maxStudents ? Number(maxStudents) : null,
      duration_days: durationDays ? Number(durationDays) : null,
      curriculum_sections: sections,
      teacher_ids: teacherIds,
    };

    if (courseStatus === 'active' && !course.published_at) {
      payload.published_at = new Date().toISOString();
    }

    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setErrorMsg(data.error ?? 'Failed to save changes'); return; }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="flex flex-col h-full -m-4">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b bg-card px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/courses" className="flex items-center gap-1.5 shrink-0 rounded-lg border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-primary">Editing</span>
              <h1 className="truncate text-sm font-semibold">{title || course.title}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {course.published_at && (
            <a href={`/courses/${course.slug}`} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <ExternalLink className="h-3.5 w-3.5" /> View Live
            </a>
          )}
          {errorMsg && (
            <span className="hidden md:flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
            </span>
          )}
          {saved && (
            <span className="hidden md:flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Saved!
            </span>
          )}
          <Button onClick={save} disabled={submitting || !title || !category} className="gap-1.5 h-8 px-4 text-sm">
            {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> Save Changes</>}
          </Button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar nav */}
        <aside className="w-56 shrink-0 border-r bg-card overflow-y-auto">
          <nav className="p-2 space-y-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${active ? 'text-primary-foreground' : ''}`}>{tab.label}</p>
                    <p className={`truncate text-[11px] leading-tight ${active ? 'text-primary-foreground/70' : 'text-muted-foreground/70'}`}>{tab.description}</p>
                  </div>
                  {active && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary-foreground/70" />}
                </button>
              );
            })}
          </nav>

          {/* Slug info at bottom of sidebar */}
          <div className="border-t mx-2 my-2 px-3 py-3">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">URL Slug</p>
            <p className="break-all font-mono text-xs text-foreground">{course.slug}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Slug doesn't change on edit</p>
          </div>
        </aside>

        {/* Content pane */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-3xl px-6 py-8">

            {/* ── BASIC ─────────────────────────────────────────────────── */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <SectionTitle>Basic Information</SectionTitle>

                <div>
                  <FieldLabel htmlFor="title" required>Course Title</FieldLabel>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., BCS Preparation Complete Course 2026" className="text-base font-medium" required />
                  <Hint>This is the primary name shown to students across all listings.</Hint>
                </div>

                <Divider />

                <div>
                  <FieldLabel htmlFor="shortDesc">Short Description</FieldLabel>
                  <TiptapEditor
                    value={shortDescription}
                    onChange={setShortDesc}
                    placeholder="A compelling one-liner shown on course cards and search results…"
                    minHeight="100px"
                    maxChars={300}
                  />
                  <Hint>Keep it under 300 characters for best display on cards and search results.</Hint>
                </div>

                <div>
                  <FieldLabel htmlFor="description">Full Description</FieldLabel>
                  <TiptapEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Detailed description — what students will learn, who it's for, prerequisites, outcomes…"
                    minHeight="260px"
                  />
                </div>

                <Divider />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="category" required>Category</FieldLabel>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <FieldLabel htmlFor="courseType">Course Type</FieldLabel>
                    <Select value={courseType} onValueChange={v => setCourseType(v as CourseType)}>
                      <SelectTrigger id="courseType"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="premium-guided">Premium Guided</SelectItem>
                          <SelectItem value="self-paced">Self-Paced</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Hint>
                      {courseType === 'premium-guided' && 'Full support, live exams, and community access.'}
                      {courseType === 'self-paced'     && 'Recorded content only, no live support.'}
                      {courseType === 'free'           && 'Auto-enroll, no payment required.'}
                    </Hint>
                  </div>
                </div>
              </div>
            )}

            {/* ── INSTRUCTOR ─────────────────────────────────────────────── */}
            {activeTab === 'instructor' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <SectionTitle>Instructor Assignment</SectionTitle>
                  {teacherIds.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {teacherIds.length} assigned
                    </span>
                  )}
                </div>

                {/* Selected instructors chips */}
                {teacherIds.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned Instructors</p>
                    <div className="flex flex-col gap-2">
                      {teacherIds.map((tid, idx) => {
                        const t = teachers.find(t => t.id === tid);
                        if (!t) return null;
                        return (
                          <div key={tid} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                            {/* Position badge */}
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                              {idx + 1}
                            </span>
                            {/* Avatar */}
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                              {(t.full_name ?? t.email ?? '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{t.full_name ?? '—'}</p>
                              <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                            </div>
                            {idx === 0 && (
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                Primary
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setTeacherIds(ids => ids.filter(i => i !== tid))}
                              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">First instructor is marked as Primary and stored as the course owner.</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 rounded-2xl border border-dashed px-5 py-5 text-muted-foreground">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserCog className="h-5 w-5 opacity-40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No instructors assigned</p>
                      <p className="text-xs mt-0.5">Select one or more instructors from the list below.</p>
                    </div>
                  </div>
                )}

                <Divider />

                {/* Picker */}
                <div>
                  <p className="mb-3 text-sm font-medium">Add Instructors</p>
                  {teachers.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
                      <UserCog className="h-10 w-10 opacity-20" />
                      <div>
                        <p className="text-sm font-medium text-foreground">No active instructors yet</p>
                        <p className="mt-0.5 text-xs">Add instructors from the Users section first.</p>
                      </div>
                      <a
                        href="/admin/users/instructors"
                        className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <UserCog className="h-3.5 w-3.5" /> Go to Instructors
                      </a>
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-card overflow-hidden">
                      {/* Search */}
                      <div className="flex items-center gap-2 border-b px-4 py-2.5">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <input
                          value={teacherSearch}
                          onChange={e => setTeacherSearch(e.target.value)}
                          placeholder="Search by name or email…"
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-0.5"
                        />
                        {teacherSearch && (
                          <button type="button" onClick={() => setTeacherSearch('')}
                            className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* List — click toggles selection */}
                      <div className="divide-y max-h-[420px] overflow-y-auto">
                        {teachers
                          .filter(t => {
                            const q = teacherSearch.toLowerCase();
                            return !q || (t.full_name ?? '').toLowerCase().includes(q) || (t.email ?? '').toLowerCase().includes(q);
                          })
                          .map(t => {
                            const selected = teacherIds.includes(t.id);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() =>
                                  setTeacherIds(ids =>
                                    selected ? ids.filter(i => i !== t.id) : [...ids, t.id]
                                  )
                                }
                                className={`group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors ${
                                  selected ? 'bg-primary/5' : 'hover:bg-muted/50'
                                }`}
                              >
                                {/* Checkbox-style toggle */}
                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                  selected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border group-hover:border-primary/50'
                                }`}>
                                  {selected && <Check className="h-3 w-3" />}
                                </div>
                                {/* Avatar */}
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                                  selected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                }`}>
                                  {(t.full_name ?? t.email ?? '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold truncate ${selected ? 'text-primary' : ''}`}>
                                    {t.full_name ?? '—'}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                                </div>
                                {selected && (
                                  <span className="shrink-0 text-xs text-muted-foreground">
                                    #{teacherIds.indexOf(t.id) + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        }
                        {teachers.filter(t => {
                          const q = teacherSearch.toLowerCase();
                          return !q || (t.full_name ?? '').toLowerCase().includes(q) || (t.email ?? '').toLowerCase().includes(q);
                        }).length === 0 && (
                          <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                            <Search className="h-6 w-6 opacity-20" />
                            <p className="text-sm">No instructors match &ldquo;{teacherSearch}&rdquo;</p>
                          </div>
                        )}
                      </div>

                      {/* Footer summary */}
                      {teacherIds.length > 0 && (
                        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2.5">
                          <span className="text-xs text-muted-foreground">
                            {teacherIds.length} instructor{teacherIds.length !== 1 ? 's' : ''} selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setTeacherIds([])}
                            className="text-xs text-destructive hover:underline"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── MEDIA ──────────────────────────────────────────────────── */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                <SectionTitle>Media</SectionTitle>

                <div>
                  <FieldLabel htmlFor="thumbnail">Thumbnail URL</FieldLabel>
                  <div className="flex gap-3">
                    <Input id="thumbnail" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://… paste image URL" className="flex-1" />
                  </div>
                  <Hint>Recommended size: 1280×720 (16:9). JPG or PNG.</Hint>
                </div>

                {/* Preview */}
                <div className="overflow-hidden rounded-2xl border bg-muted/30">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full object-cover aspect-video" onError={e => { (e.target as HTMLImageElement).src = ''; }} />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                      <ImageIcon className="h-16 w-16 opacity-20" strokeWidth={1} />
                      <p className="text-sm">No thumbnail yet — paste a URL above</p>
                    </div>
                  )}
                </div>

                {thumbnailUrl && (
                  <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive gap-1.5" onClick={() => setThumbnailUrl('')}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove Thumbnail
                  </Button>
                )}
              </div>
            )}

            {/* ── PRICING ────────────────────────────────────────────────── */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <SectionTitle>Pricing & Monetization</SectionTitle>

                {/* Pricing type */}
                <div>
                  <FieldLabel>Pricing Type</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {(['paid', 'free'] as PricingType[]).map(type => (
                      <button key={type} type="button" disabled={courseType === 'free'}
                        onClick={() => setPricingType(type)}
                        className={`rounded-xl border p-4 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${(pricingType === type || (courseType === 'free' && type === 'free')) ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/40'}`}
                      >
                        <p className="font-semibold capitalize">{type === 'paid' ? '💳 Paid' : '🎁 Free'}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{type === 'paid' ? 'Requires manual payment verification' : 'Students auto-enroll, no payment'}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {isFree ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Free Course</p>
                      <p className="text-xs text-emerald-600/80 dark:text-emerald-500">No payment required — students enroll instantly</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Divider />

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="price" required>Regular Price (৳)</FieldLabel>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">৳</span>
                          <Input id="price" type="number" min="0" step="1" value={priceBdt} onChange={e => setPriceBdt(e.target.value)} placeholder="e.g., 2500" className="pl-8" required />
                        </div>
                      </div>

                      <div>
                        <FieldLabel htmlFor="promoCode">Promo Code</FieldLabel>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input id="promoCode" value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="e.g., EID2026" className="pl-9" />
                        </div>
                      </div>
                    </div>

                    <Divider />
                    <p className="text-sm font-semibold">Discount</p>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="discountType">Discount Type</FieldLabel>
                        <Select value={discountType} onValueChange={v => setDiscountType(v as DiscountType)}>
                          <SelectTrigger id="discountType"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="flat">Flat Amount (৳)</SelectItem>
                              <SelectItem value="percentile">Percentage (%)</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {discountType === 'flat' ? (
                        <div>
                          <FieldLabel htmlFor="flatDiscount">Discounted Price (৳)</FieldLabel>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">৳</span>
                            <Input id="flatDiscount" type="number" min="0" value={flatDiscount} onChange={e => setFlatDiscount(e.target.value)} placeholder="Final price after discount" className="pl-8" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <FieldLabel htmlFor="discountPct">Discount Percentage (%)</FieldLabel>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input id="discountPct" type="number" min="0" max="100" step="0.1" value={discountPct} onChange={e => setDiscountPct(e.target.value)} placeholder="e.g., 20" className="pl-9" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live price preview */}
                    {Number(priceBdt) > 0 && (
                      <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-5 py-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Student pays</p>
                          {computedDiscount > 0 && computedDiscount < Number(priceBdt) ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">৳{computedDiscount.toLocaleString()}</span>
                              <span className="text-sm text-muted-foreground line-through">৳{Number(priceBdt).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold">৳{Number(priceBdt).toLocaleString()}</span>
                          )}
                        </div>
                        {computedDiscount > 0 && computedDiscount < Number(priceBdt) && (
                          <div className="rounded-xl bg-emerald-500/15 px-4 py-2 text-center">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">Student saves</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {Math.round(((Number(priceBdt) - computedDiscount) / Number(priceBdt)) * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <Divider />
                    <p className="text-sm font-semibold">Access Validity</p>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel htmlFor="expiryPeriod">Access Period</FieldLabel>
                        <Select value={expiryPeriod} onValueChange={v => setExpiryPeriod(v as ExpiryPeriod)}>
                          <SelectTrigger id="expiryPeriod"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="lifetime">Lifetime Access</SelectItem>
                              <SelectItem value="limited">Limited Time</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      {expiryPeriod === 'limited' && (
                        <div>
                          <FieldLabel htmlFor="expiryMonths">Duration (Months)</FieldLabel>
                          <Input id="expiryMonths" type="number" min="1" value={expiryMonths} onChange={e => setExpiryMonths(e.target.value)} placeholder="e.g., 6" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── FEATURES ───────────────────────────────────────────────── */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <SectionTitle>Course Features</SectionTitle>
                <p className="text-sm text-muted-foreground -mt-4">Enable the features included with this course. These are shown on the course listing and detail pages.</p>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Support & Community</p>
                  <FeatureToggle id="feat-support"   icon={MessageCircle} label="Dedicated Support"   description="Students get direct access to teacher & staff support channels" checked={hasSupport}    onChange={setHasSupport} />
                  <FeatureToggle id="feat-facebook"  icon={Users}         label="Facebook Group"      description="Access to a private Facebook community for enrolled students"  checked={hasFacebook}   onChange={setHasFacebook} />
                  <FeatureToggle id="feat-classroom" icon={Globe}         label="Google Classroom"    description="Course materials and assignments via Google Classroom"           checked={hasClassroom}  onChange={setHasClassroom} />
                </div>

                <Divider />

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Examinations</p>
                  <FeatureToggle id="feat-live-exam" icon={Zap}           label="Live Exams"          description="Scheduled MCQ exams with real-time rankings and leaderboards"    checked={hasLiveExam}    onChange={setHasLiveExam} />
                  <FeatureToggle id="feat-written"   icon={FileText}      label="Written Exams"       description="Written exam submissions with manual teacher evaluation"          checked={hasWrittenExam} onChange={setHasWrittenExam} />
                </div>
              </div>
            )}

            {/* ── CURRICULUM ─────────────────────────────────────────────── */}
            {activeTab === 'curriculum' && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionTitle>Curriculum</SectionTitle>
                    <p className="text-sm text-muted-foreground -mt-4">Outline what's included in this course. Students see this on the course detail page.</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                </div>
                <CurriculumBuilder sections={sections} onChange={setSections} />
              </div>
            )}

            {/* ── SETTINGS ───────────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <SectionTitle>Settings</SectionTitle>

                {/* Status */}
                <div>
                  <FieldLabel htmlFor="status">Publish Status</FieldLabel>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {STATUS_OPTS.map(opt => (
                      <button key={opt.value} type="button" onClick={() => setCourseStatus(opt.value)}
                        className={`rounded-xl border p-3 text-left transition-all ${courseStatus === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/40'}`}
                      >
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${opt.color}`}>{opt.label}</span>
                        <p className="mt-1.5 text-xs text-muted-foreground leading-snug">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                  {currentStatus && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Radio className="h-3 w-3" /> Current: <span className="font-medium text-foreground">{currentStatus.label}</span> — {currentStatus.desc}
                    </p>
                  )}
                </div>

                <Divider />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="durationDays">Course Duration (Days)</FieldLabel>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input id="durationDays" type="number" min="1" value={durationDays} onChange={e => setDurationDays(e.target.value)} placeholder="e.g., 180" className="pl-9" />
                    </div>
                    <Hint>The number of days students have access from enrollment. Leave blank for unlimited.</Hint>
                  </div>

                  <div>
                    <FieldLabel htmlFor="maxStudents">Max Enrollment</FieldLabel>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input id="maxStudents" type="number" min="1" value={maxStudents} onChange={e => setMaxStudents(e.target.value)} placeholder="Unlimited" className="pl-9" />
                    </div>
                    <Hint>Enrollment closes automatically when this limit is reached. Leave blank for unlimited.</Hint>
                  </div>
                </div>

                <Divider />

                {/* Read-only meta */}
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Course Metadata (Read-only)</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course ID</span>
                    <span className="font-mono text-xs">{course.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">URL Slug</span>
                    <span className="font-mono text-xs">{course.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-xs">{new Date(course.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="text-xs">{new Date(course.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Published</span>
                    <span className="text-xs">{course.published_at ? new Date(course.published_at).toLocaleDateString() : '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error message (mobile fallback) */}
            {errorMsg && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 md:hidden">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-sm text-destructive">{errorMsg}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
