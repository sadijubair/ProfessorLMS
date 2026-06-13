-- Phase 3: standalone question-bank practice tracking.

CREATE TABLE IF NOT EXISTS question_practice_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id),
  is_correct BOOLEAN,
  practice_mode VARCHAR(50) NOT NULL CHECK (
    practice_mode IN ('topic', 'timed', 'random', 'previous_year', 'weak_area')
  ),
  time_spent_seconds INTEGER DEFAULT 0,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_question_practice_student
  ON question_practice_attempts(student_id);

CREATE INDEX IF NOT EXISTS idx_question_practice_course
  ON question_practice_attempts(course_id);

CREATE INDEX IF NOT EXISTS idx_question_practice_question
  ON question_practice_attempts(question_id);

ALTER TABLE question_practice_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "question_practice_select_own" ON question_practice_attempts
  FOR SELECT USING (auth.uid()::text = student_id::text);

CREATE POLICY "question_practice_insert_own" ON question_practice_attempts
  FOR INSERT WITH CHECK (auth.uid()::text = student_id::text);
