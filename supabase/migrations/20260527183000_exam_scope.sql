-- Exam Scope Support
-- Allows exams to be either course-specific or open (platform-wide)
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Make course_id nullable — open exams are not tied to any course
ALTER TABLE exams ALTER COLUMN course_id DROP NOT NULL;

-- 2. Add scope column
ALTER TABLE exams
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20) NOT NULL DEFAULT 'course'
  CHECK (scope IN ('course', 'open'));

-- 3. Backfill existing rows (all existing exams are course-scoped)
UPDATE exams SET scope = 'course' WHERE scope IS NULL OR scope = '';

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_exams_scope ON exams(scope);
CREATE INDEX IF NOT EXISTS idx_exams_course_id ON exams(course_id) WHERE course_id IS NOT NULL;
