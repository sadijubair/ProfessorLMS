-- Junction table: a course can have multiple instructors
CREATE TABLE IF NOT EXISTS course_instructors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, teacher_id)
);

-- Index for fast lookups by course
CREATE INDEX IF NOT EXISTS idx_course_instructors_course_id ON course_instructors(course_id);
-- Index for fast lookups by teacher
CREATE INDEX IF NOT EXISTS idx_course_instructors_teacher_id ON course_instructors(teacher_id);
