ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS page_sections TEXT[] NOT NULL DEFAULT '{}'::text[];