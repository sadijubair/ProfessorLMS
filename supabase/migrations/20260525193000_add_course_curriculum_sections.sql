ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS curriculum_sections JSONB NOT NULL DEFAULT '[]'::jsonb;