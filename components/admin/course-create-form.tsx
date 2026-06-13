'use client';

import { Switch } from '@/components/ui/switch';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Settings2,
  CircleDollarSign,
  Radio,
  CheckCircle2,
  GraduationCap,
  Tag,
  Clock,
  Users,
  Zap,
  FileText,
  MessageCircle,
  Globe,
  MonitorPlay,
  AlertCircle,
  Loader2,
  ImageIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TiptapEditor } from '@/components/admin/tiptap-editor';

// ─── Types ──────────────────────────────────────────────────────────────────

type CourseType = 'premium-guided' | 'self-paced' | 'free';
type PricingType = 'paid' | 'free';
type DiscountType = 'flat' | 'percentile';
type ExpiryPeriod = 'lifetime' | 'limited';
type CourseStatus = 'active' | 'private' | 'upcoming' | 'pending' | 'draft' | 'inactive';



function FeatureToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  id,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-150 ${
        checked
          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30'
          : 'border-border hover:border-border/80 hover:bg-muted/40'
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-1 shrink-0"
      />
    </label>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  accent = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className={`flex items-start gap-3 px-6 py-5 ${accent ? 'bg-primary/5 border-b border-primary/10' : 'border-b'}`}>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Label ───────────────────────────────────────────────────────────────────

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

// ─── Hint ────────────────────────────────────────────────────────────────────

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs text-muted-foreground">{children}</p>;
}



// ─── Price Preview Card ──────────────────────────────────────────────────────

function PricePreview({
  priceBdt,
  discountedPrice,
  isFree,
  discountType,
  discountPercent,
}: {
  priceBdt: number;
  discountedPrice: number;
  isFree: boolean;
  discountType: DiscountType;
  discountPercent: number;
}) {
  if (isFree) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Free Course — No payment required
        </span>
      </div>
    );
  }

  if (!priceBdt) return null;

  const hasDiscount = discountedPrice > 0 && discountedPrice < priceBdt;
  const savings = priceBdt - discountedPrice;
  const savingsPercent =
    discountType === 'percentile' ? discountPercent : Math.round((savings / priceBdt) * 100);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3">
      <div>
        <p className="text-xs text-muted-foreground">Student pays</p>
        {hasDiscount ? (
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">৳{discountedPrice.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground line-through">৳{priceBdt.toLocaleString()}</span>
          </div>
        ) : (
          <span className="text-xl font-bold text-foreground">৳{priceBdt.toLocaleString()}</span>
        )}
      </div>
      {hasDiscount && (
        <div className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-center">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">You save</p>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {savingsPercent}%
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_OPTS: { value: CourseStatus; label: string; color: string; desc: string }[] = [
  { value: 'draft',    label: 'Draft',    color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300', desc: 'Saved but not visible' },
  { value: 'active',   label: 'Active',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400', desc: 'Publicly listed and enrollable' },
  { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400', desc: 'Visible but not yet enrollable' },
  { value: 'private',  label: 'Private',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400', desc: 'Hidden, direct link only' },
  { value: 'pending',  label: 'Pending',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400', desc: 'Awaiting review' },
  { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400', desc: 'Disabled / archived' },
];

// ─── Main Form ───────────────────────────────────────────────────────────────

export function CourseCreateForm({ categories }: { categories: string[] }) {
  const router = useRouter();

  // State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Basic Info
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Config
  const [category, setCategory] = useState('');
  const [courseType, setCourseType] = useState<CourseType>('premium-guided');
  const [courseStatus, setCourseStatus] = useState<CourseStatus>('draft');
  const [durationDays, setDurationDays] = useState('');
  const [maxStudents, setMaxStudents] = useState('');

  // Pricing
  const [pricingType, setPricingType] = useState<PricingType>('paid');
  const [priceBdt, setPriceBdt] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('flat');
  const [flatDiscountedPrice, setFlatDiscountedPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [expiryPeriod, setExpiryPeriod] = useState<ExpiryPeriod>('lifetime');
  const [expiryMonths, setExpiryMonths] = useState('');

  // Features
  const [hasSupport, setHasSupport] = useState(false);
  const [hasFacebookGroup, setHasFacebookGroup] = useState(false);
  const [hasGoogleClassroom, setHasGoogleClassroom] = useState(false);
  const [hasLiveExam, setHasLiveExam] = useState(false);
  const [hasWrittenExam, setHasWrittenExam] = useState(false);

  const isFree = pricingType === 'free' || courseType === 'free';

  const computedDiscountedPrice = useMemo(() => {
    if (isFree) return 0;
    const base = Number(priceBdt) || 0;
    if (discountType === 'percentile') {
      const pct = Number(discountPercent) || 0;
      return Math.max(0, Math.round(base - (base * pct) / 100));
    }
    return Math.max(0, Math.round(Number(flatDiscountedPrice) || 0));
  }, [isFree, priceBdt, discountType, discountPercent, flatDiscountedPrice]);

  const isSelfPaced = courseType === 'self-paced';

  const currentStatusOpt = STATUS_OPTS.find((s) => s.value === courseStatus);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await fetch('/api/courses/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        category,
        pricingType: isFree ? 'free' : 'paid',
        priceBdt: isFree ? 0 : Number(priceBdt) || 0,
        durationDays: durationDays ? Number(durationDays) : undefined,
        isFree,
        isSelfPaced,
        hasSupport,
        hasFacebookGroup,
        hasGoogleClassroom,
        hasLiveExam,
        hasWrittenExam,
        requiresManualPayment: !isFree,
        promoCode: promoCode || undefined,
        discountType,
        discountValueBdt: isFree ? undefined : computedDiscountedPrice || undefined,
        expiryPeriod,
        expiryMonths: expiryMonths ? Number(expiryMonths) : undefined,
        courseStatus,
        thumbnailUrl: thumbnailUrl || undefined,
        maxStudents: maxStudents ? Number(maxStudents) : undefined,
      }),
    });

    const payload = await res.json();

    if (!res.ok) {
      setErrorMsg(payload.error || 'Course creation failed');
      setSubmitting(false);
      return;
    }

    setSuccessMsg('Course created successfully!');
    setTimeout(() => {
      router.push('/admin/courses');
      router.refresh();
    }, 800);
  }

  const allCategories = categories.length
    ? categories
    : ['BCS', 'Bank', 'Admission', 'Academic', 'Skill'];

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── Main form column ── */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* 1. Basic Information */}
          <FormSection icon={BookOpen} title="Basic Information" description="Course title, descriptions, and thumbnail" accent>
            <div className="space-y-5">
              <div>
                <Label htmlFor="title" required>Course Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., BCS Preparation Complete Course 2026"
                  required
                  className="text-base font-medium"
                />
                <Hint>Use a clear, descriptive title. This is what students will search for.</Hint>
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <TiptapEditor
                  value={shortDescription}
                  onChange={setShortDescription}
                  placeholder="A one-liner shown on course cards and listings…"
                  minHeight="100px"
                  maxChars={300}
                />
                <Hint>Keep it under 300 characters for best display on cards and listings.</Hint>
              </div>

              <div>
                <Label htmlFor="description">Full Description</Label>
                <TiptapEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Detailed course description — what students will learn, prerequisites, outcomes…"
                  minHeight="260px"
                />
              </div>

              {/* Thumbnail */}
              <div>
                <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                <div className="flex gap-3">
                  <Input
                    id="thumbnailUrl"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://… (paste image URL)"
                    className="flex-1"
                  />
                  {thumbnailUrl && (
                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
                {!thumbnailUrl && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-30" />
                    <span className="text-xs">No thumbnail — a default placeholder will be shown</span>
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          {/* 2. Configuration */}
          <FormSection icon={Settings2} title="Course Configuration" description="Category, type, duration, and capacity">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="category" required>Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="courseType" required>Course Type</Label>
                <Select value={courseType} onValueChange={(v) => setCourseType(v as CourseType)}>
                  <SelectTrigger id="courseType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="premium-guided">
                        <span className="font-medium">Premium Guided</span>
                        <span className="block text-xs text-muted-foreground">Full support, FB group, live exams</span>
                      </SelectItem>
                      <SelectItem value="self-paced">
                        <span className="font-medium">Self-Paced</span>
                        <span className="block text-xs text-muted-foreground">Recorded content, no live support</span>
                      </SelectItem>
                      <SelectItem value="free">
                        <span className="font-medium">Free</span>
                        <span className="block text-xs text-muted-foreground">Auto-enroll, lead generation</span>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Hint>
                  {courseType === 'premium-guided' && 'Includes all support channels and live exam access.'}
                  {courseType === 'self-paced' && 'No support or community — student learns independently.'}
                  {courseType === 'free' && 'Students are auto-enrolled, no payment needed.'}
                </Hint>
              </div>

              <div>
                <Label htmlFor="durationDays">Duration (Days)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="durationDays"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="e.g., 180"
                    className="pl-9"
                  />
                </div>
                <Hint>Leave blank for no expiry on access.</Hint>
              </div>

              <div>
                <Label htmlFor="maxStudents">Max Students</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="maxStudents"
                    type="number"
                    min="1"
                    value={maxStudents}
                    onChange={(e) => setMaxStudents(e.target.value)}
                    placeholder="Unlimited"
                    className="pl-9"
                  />
                </div>
                <Hint>Leave blank for unlimited enrollment.</Hint>
              </div>
            </div>
          </FormSection>

          {/* 3. Pricing */}
          <FormSection icon={CircleDollarSign} title="Pricing & Monetization" description="Set price, discounts, and validity">
            <div className="space-y-5">
              {/* Pricing type toggle */}
              <div className="grid grid-cols-2 gap-3">
                {(['paid', 'free'] as PricingType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPricingType(type)}
                    disabled={courseType === 'free'}
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      pricingType === type || (courseType === 'free' && type === 'free')
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border hover:bg-muted/40'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <p className="text-sm font-semibold capitalize">{type}</p>
                    <p className="text-xs text-muted-foreground">
                      {type === 'paid' ? 'Manual payment verification' : 'Auto-enroll, no payment'}
                    </p>
                  </button>
                ))}
              </div>

              {/* Paid fields */}
              {!isFree && (
                <>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="price" required>Price (৳)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">৳</span>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="1"
                          value={priceBdt}
                          onChange={(e) => setPriceBdt(e.target.value)}
                          placeholder="e.g., 2000"
                          className="pl-8"
                          required={!isFree}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="promoCode">Promo Code</Label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                          id="promoCode"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Optional e.g., EID2026"
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="discountType">Discount Type</Label>
                      <Select value={discountType} onValueChange={(v) => setDiscountType(v as DiscountType)}>
                        <SelectTrigger id="discountType">
                          <SelectValue />
                        </SelectTrigger>
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
                        <Label htmlFor="flatDiscountedPrice">Discounted Price (৳)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">৳</span>
                          <Input
                            id="flatDiscountedPrice"
                            type="number"
                            min="0"
                            step="1"
                            value={flatDiscountedPrice}
                            onChange={(e) => setFlatDiscountedPrice(e.target.value)}
                            placeholder="Final price after discount"
                            className="pl-8"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="discountPercent">Discount (%)</Label>
                          <Input
                            id="discountPercent"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={discountPercent}
                            onChange={(e) => setDiscountPercent(e.target.value)}
                            placeholder="e.g., 20"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="expiryPeriod">Access Validity</Label>
                      <Select value={expiryPeriod} onValueChange={(v) => setExpiryPeriod(v as ExpiryPeriod)}>
                        <SelectTrigger id="expiryPeriod">
                          <SelectValue />
                        </SelectTrigger>
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
                        <Label htmlFor="expiryMonths">Duration (Months)</Label>
                        <Input
                          id="expiryMonths"
                          type="number"
                          min="1"
                          value={expiryMonths}
                          onChange={(e) => setExpiryMonths(e.target.value)}
                          placeholder="e.g., 6"
                        />
                      </div>
                    )}
                  </div>

                  {/* Price preview */}
                  <PricePreview
                    priceBdt={Number(priceBdt) || 0}
                    discountedPrice={computedDiscountedPrice}
                    isFree={isFree}
                    discountType={discountType}
                    discountPercent={Number(discountPercent)}
                  />
                </>
              )}

              {isFree && (
                <PricePreview
                  priceBdt={0}
                  discountedPrice={0}
                  isFree
                  discountType="flat"
                  discountPercent={0}
                />
              )}
            </div>
          </FormSection>

          {/* 4. Features */}
          <FormSection icon={Zap} title="Course Features" description="Enable features included with this course">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FeatureToggle
                id="feat-support"
                icon={MessageCircle}
                label="Support"
                description="Dedicated teacher & staff support"
                checked={hasSupport}
                onChange={setHasSupport}
              />
              <FeatureToggle
                id="feat-facebook"
                icon={Users}
                label="Facebook Group"
                description="Private FB community access"
                checked={hasFacebookGroup}
                onChange={setHasFacebookGroup}
              />
              <FeatureToggle
                id="feat-classroom"
                icon={Globe}
                label="Google Classroom"
                description="Google Classroom integration"
                checked={hasGoogleClassroom}
                onChange={setHasGoogleClassroom}
              />
              <FeatureToggle
                id="feat-live-exam"
                icon={Zap}
                label="Live Exams"
                description="Scheduled MCQ exams with rankings"
                checked={hasLiveExam}
                onChange={setHasLiveExam}
              />
              <FeatureToggle
                id="feat-written"
                icon={FileText}
                label="Written Exams"
                description="Written exams with manual marking"
                checked={hasWrittenExam}
                onChange={setHasWrittenExam}
              />
            </div>
          </FormSection>

          {/* Error / Success */}
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{successMsg}</p>
            </div>
          )}
        </div>

        {/* ── Sticky sidebar ── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0">
          <div className="sticky top-6 space-y-4">

            {/* Status + Publish card */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary" /> Publish Status
                </h3>
                <Select value={courseStatus} onValueChange={(v) => setCourseStatus(v as CourseStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_OPTS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="font-medium">{opt.label}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {currentStatusOpt && (
                  <p className="mt-2 text-xs text-muted-foreground">{currentStatusOpt.desc}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={submitting || !title || !category}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {courseStatus === 'active' ? 'Publish Course' : 'Save Course'}
                  </>
                )}
              </Button>

              {(!title || !category) && (
                <p className="text-center text-xs text-muted-foreground">
                  Fill in title & category to continue
                </p>
              )}
            </div>

            {/* Quick summary card */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" /> Course Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{courseType.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{category || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {isFree ? 'Free' : priceBdt ? `৳ ${Number(priceBdt).toLocaleString()}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{durationDays ? `${durationDays} days` : 'Unlimited'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max students</span>
                  <span className="font-medium">{maxStudents || 'Unlimited'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validity</span>
                  <span className="font-medium capitalize">{isFree ? 'Lifetime' : expiryPeriod}</span>
                </div>

                {/* Active features */}
                <div className="pt-2 border-t space-y-1">
                  {[
                    [hasSupport, 'Support'],
                    [hasFacebookGroup, 'FB Group'],
                    [hasGoogleClassroom, 'Google Classroom'],
                    [hasLiveExam, 'Live Exams'],
                    [hasWrittenExam, 'Written Exams'],
                  ].map(([on, label]) =>
                    on ? (
                      <div key={label as string} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-xs">{label as string}</span>
                      </div>
                    ) : null,
                  )}
                  {!hasSupport && !hasFacebookGroup && !hasGoogleClassroom && !hasLiveExam && !hasWrittenExam && (
                    <p className="text-xs text-muted-foreground italic">No features enabled yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail preview */}
            {thumbnailUrl && (
              <div className="rounded-2xl border bg-card p-3 shadow-sm overflow-hidden">
                <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Thumbnail Preview</p>
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
                  <img
                    src={thumbnailUrl}
                    alt="Course thumbnail"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
