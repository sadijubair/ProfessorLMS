'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Users,
  Clock,
  Globe,
  Zap,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GraduationCap,
  Filter,
  CircleDollarSign,
  Tag,
  Percent,
  Check,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Course = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  category: string;
  price_bdt: number;
  is_free: boolean;
  is_self_paced: boolean;
  has_support: boolean;
  has_facebook_group: boolean;
  has_google_classroom: boolean;
  has_live_exam: boolean;
  has_written_exam: boolean;
  thumbnail_url?: string | null;
  published_at?: string | null;
  course_status?: string | null;
  pricing_type?: string | null;
  max_students?: number | null;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:   { label: 'Active',    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  draft:    { label: 'Draft',     color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
  private:  { label: 'Private',   color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  upcoming: { label: 'Upcoming',  color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  inactive: { label: 'Inactive',  color: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

const CATEGORY_COLORS: Record<string, string> = {
  BCS:       'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  Bank:      'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  Admission: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  Academic:  'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  Skill:     'bg-teal-500/15 text-teal-600 dark:text-teal-400',
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? 'bg-primary/15 text-primary';
}

function getCourseStatus(course: Course) {
  if (course.course_status) return course.course_status;
  return course.published_at ? 'active' : 'draft';
}

// ─── Price Edit Dialog ───────────────────────────────────────────────────────

function PriceEditDialog({
  course,
  open,
  onOpenChange,
}: {
  course: Course;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isFreeInit = course.pricing_type === 'free' || course.is_free;
  const [pricingType, setPricingType] = useState<'paid' | 'free'>(isFreeInit ? 'free' : 'paid');
  const [priceBdt, setPriceBdt] = useState(String(course.price_bdt ?? 0));
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentile'>('flat');
  const [flatDiscountedPrice, setFlatDiscountedPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [expiryPeriod, setExpiryPeriod] = useState<'lifetime' | 'limited'>('lifetime');
  const [expiryMonths, setExpiryMonths] = useState('');

  const isFree = pricingType === 'free';

  const computedDiscountedPrice = useMemo(() => {
    if (isFree) return 0;
    const base = Number(priceBdt) || 0;
    if (discountType === 'percentile') {
      const pct = Number(discountPercent) || 0;
      return Math.max(0, Math.round(base - (base * pct) / 100));
    }
    return Math.max(0, Math.round(Number(flatDiscountedPrice) || 0));
  }, [isFree, priceBdt, discountType, discountPercent, flatDiscountedPrice]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_price',
        pricingType,
        priceBdt: isFree ? 0 : Number(priceBdt) || 0,
        isFree,
        promoCode: promoCode || null,
        discountType,
        discountValueBdt: isFree ? null : computedDiscountedPrice || null,
        expiryPeriod,
        expiryMonths: expiryMonths ? Number(expiryMonths) : null,
      }),
    });

    const payload = await res.json();
    setSaving(false);

    if (!res.ok) {
      setSaveError(payload.error ?? 'Failed to update price');
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => {
      onOpenChange(false);
      setSaved(false);
    }, 900);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md!">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-primary" />
            Edit Pricing
          </AlertDialogTitle>
          <AlertDialogDescription className="line-clamp-1">
            {course.title}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Form body */}
        <div className="space-y-4 py-1">

          {/* Pricing type toggle */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Pricing Type</p>
            <div className="grid grid-cols-2 gap-2">
              {(['paid', 'free'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPricingType(type)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                    pricingType === type
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30 font-semibold'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  {type === 'paid' ? '💳 Paid' : '🎁 Free'}
                </button>
              ))}
            </div>
          </div>

          {/* Paid fields */}
          {!isFree && (
            <>
              {/* Price */}
              <div>
                <label className="mb-1.5 block text-xs font-medium">Price (৳)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={priceBdt}
                    onChange={(e) => setPriceBdt(e.target.value)}
                    placeholder="e.g., 2000"
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Promo code */}
              <div>
                <label className="mb-1.5 block text-xs font-medium">Promo Code</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Optional (e.g., EID2026)"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Discount type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Discount Type</label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'flat' | 'percentile')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="flat">Flat (৳)</SelectItem>
                        <SelectItem value="percentile">Percent (%)</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {discountType === 'flat' ? (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Discounted Price (৳)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                      <Input
                        type="number"
                        min="0"
                        value={flatDiscountedPrice}
                        onChange={(e) => setFlatDiscountedPrice(e.target.value)}
                        placeholder="Final price"
                        className="pl-8"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Discount (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        placeholder="e.g., 20"
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Price preview */}
              {Number(priceBdt) > 0 && (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Student pays</p>
                    {computedDiscountedPrice > 0 && computedDiscountedPrice < Number(priceBdt) ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold">৳{computedDiscountedPrice.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground line-through">৳{Number(priceBdt).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span className="text-base font-bold">৳{Number(priceBdt).toLocaleString()}</span>
                    )}
                  </div>
                  {computedDiscountedPrice > 0 && computedDiscountedPrice < Number(priceBdt) && (
                    <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Save {Math.round(((Number(priceBdt) - computedDiscountedPrice) / Number(priceBdt)) * 100)}%
                    </span>
                  )}
                </div>
              )}

              {/* Validity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Access Validity</label>
                  <Select value={expiryPeriod} onValueChange={(v) => setExpiryPeriod(v as 'lifetime' | 'limited')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="lifetime">Lifetime</SelectItem>
                        <SelectItem value="limited">Limited</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                {expiryPeriod === 'limited' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Months</label>
                    <Input
                      type="number"
                      min="1"
                      value={expiryMonths}
                      onChange={(e) => setExpiryMonths(e.target.value)}
                      placeholder="e.g., 6"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {isFree && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Free — no payment required</span>
            </div>
          )}

          {saveError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {saveError}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check className="h-3.5 w-3.5" /> Saved!</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: Course }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  const status = getCourseStatus(course);
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['draft'];
  const isFree = course.pricing_type === 'free' || course.is_free;
  const isPublished = Boolean(course.published_at);

  async function mutate(action: 'publish' | 'unpublish' | 'delete') {
    setBusy(true);
    setError(null);

    if (action === 'delete' && !confirm(`Delete "${course.title}"? This cannot be undone.`)) {
      setBusy(false);
      return;
    }

    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: action === 'delete' ? undefined : { 'Content-Type': 'application/json' },
      body: action === 'delete' ? undefined : JSON.stringify({ action }),
    });

    const payload = await res.json();
    if (!res.ok) {
      setError(payload.error ?? 'Action failed');
      setBusy(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Thumbnail / Placeholder */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <GraduationCap className="h-16 w-16 text-primary/30" strokeWidth={1.2} />
          </div>
        )}

        {/* Status pill — top left */}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.color} backdrop-blur-sm`}>
          {statusCfg.label}
        </span>

        {/* Actions menu — top right */}
        <div className="absolute right-2 top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full opacity-0 shadow group-hover:opacity-100 transition-opacity"
                disabled={busy}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/admin/courses/${course.id}/edit`} className="flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setPriceDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <CircleDollarSign className="h-3.5 w-3.5" /> Price
              </DropdownMenuItem>
              {isPublished && (
                <DropdownMenuItem asChild>
                  <Link href={`/courses/${course.slug}`} target="_blank" className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> View Public
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => mutate(isPublished ? 'unpublish' : 'publish')}
                disabled={busy}
                className="flex items-center gap-2"
              >
                {isPublished ? (
                  <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>
                ) : (
                  <><Globe className="h-3.5 w-3.5" /> Publish</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => mutate('delete')}
                disabled={busy}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Category + Price row */}
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(course.category)}`}>
            {course.category}
          </span>
          <span className="text-sm font-bold text-foreground">
            {isFree ? (
              <span className="text-emerald-600 dark:text-emerald-400">Free</span>
            ) : (
              `৳ ${course.price_bdt.toLocaleString()}`
            )}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {course.title}
        </h3>

        {/* Description */}
        {(course.short_description || course.description) && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {course.short_description || course.description}
          </p>
        )}

        {/* Feature tags */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {course.is_self_paced && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Clock className="h-2.5 w-2.5" /> Self-paced
            </span>
          )}
          {course.has_live_exam && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Zap className="h-2.5 w-2.5" /> Live Exam
            </span>
          )}
          {course.has_written_exam && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <BookOpen className="h-2.5 w-2.5" /> Written
            </span>
          )}
          {course.has_support && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <MessageCircle className="h-2.5 w-2.5" /> Support
            </span>
          )}
          {course.has_facebook_group && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Users className="h-2.5 w-2.5" /> FB Group
            </span>
          )}
          {!course.is_self_paced && !course.has_live_exam && !course.has_written_exam && !course.has_support && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <BookOpen className="h-2.5 w-2.5" /> Basic
            </span>
          )}
        </div>
      </div>

      {/* Footer action bar */}
      <div className="flex items-center justify-between border-t px-4 py-2.5">
        {course.max_students ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> {course.max_students} seats
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" /> Unlimited
          </span>
        )}

        <div className="flex gap-1.5">
          {isPublished ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-full px-3 text-xs"
              disabled={busy}
              onClick={() => mutate('unpublish')}
            >
              <EyeOff className="mr-1 h-3 w-3" /> Unpublish
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              disabled={busy}
              onClick={() => mutate('publish')}
            >
              <Globe className="mr-1 h-3 w-3" /> Publish
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="px-4 pb-2 text-xs text-destructive">{error}</p>
      )}

      {/* Price edit dialog */}
      <PriceEditDialog
        course={course}
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
      />
    </div>
  );
}

export function CoursesGrid({
  courses,
  categories,
}: {
  courses: Course[];
  categories: Category[];
}) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.short_description ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? '').toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || c.category === selectedCategory;

      const matchStatus =
        selectedStatus === 'all' || getCourseStatus(c) === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [courses, search, selectedCategory, selectedStatus]);

  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(courses.map((c) => c.category)));
    return cats;
  }, [courses]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'private', label: 'Private' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="course-search"
            placeholder="Search courses by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by status"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length === courses.length ? (
            <>{courses.length} course{courses.length !== 1 ? 's' : ''}</>
          ) : (
            <>{filtered.length} of {courses.length} courses</>
          )}
        </p>
        {(search || selectedCategory !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedStatus('all'); }}
            className="text-xs text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <GraduationCap className="mb-3 h-12 w-12 text-muted-foreground/40" strokeWidth={1} />
          <p className="text-sm font-medium text-muted-foreground">No courses found</p>
          {(search || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters</p>
          )}
        </div>
      )}
    </div>
  );
}
