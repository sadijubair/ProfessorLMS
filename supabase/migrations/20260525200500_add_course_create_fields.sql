ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS pricing_type TEXT NOT NULL DEFAULT 'paid' CHECK (pricing_type IN ('paid', 'free')),
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'flat' CHECK (discount_type IN ('flat', 'percentile')),
  ADD COLUMN IF NOT EXISTS discount_value_bdt NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS expiry_period TEXT NOT NULL DEFAULT 'lifetime' CHECK (expiry_period IN ('lifetime', 'limited')),
  ADD COLUMN IF NOT EXISTS expiry_months INTEGER,
  ADD COLUMN IF NOT EXISTS course_status TEXT NOT NULL DEFAULT 'draft' CHECK (
    course_status IN ('active', 'private', 'upcoming', 'pending', 'draft', 'inactive')
  );