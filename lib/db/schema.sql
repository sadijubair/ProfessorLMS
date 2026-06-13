-- ProfessorLMS Database Schema
-- Phase 1: Foundation & Revenue Flow

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  mobile VARCHAR(20) UNIQUE,
  whatsapp_number VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  student_id VARCHAR(8) UNIQUE, -- YY + 6 random digits
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin', 'support', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  email_verified_at TIMESTAMP,
  phone_verified_at TIMESTAMP,
  profile_image_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(50) NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (role, permission)
);

-- Audit Logs Table (Core - Day One)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(120) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  price_bdt INTEGER DEFAULT 0,
  duration_days INTEGER,
  is_free BOOLEAN DEFAULT false,
  is_self_paced BOOLEAN DEFAULT false,
  has_support BOOLEAN DEFAULT true,
  has_facebook_group BOOLEAN DEFAULT false,
  has_google_classroom BOOLEAN DEFAULT false,
  has_live_exam BOOLEAN DEFAULT true,
  has_written_exam BOOLEAN DEFAULT false,
  requires_manual_payment BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  max_students INTEGER,
  teacher_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- Course Enrollments Table
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  roll_number VARCHAR(10) UNIQUE,
  enrollment_status VARCHAR(50) NOT NULL CHECK (enrollment_status IN ('pending', 'active', 'completed', 'dropped')),
  payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('unpaid', 'pending', 'approved', 'rejected')),
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP,
  completed_at TIMESTAMP,
  community_token VARCHAR(50) UNIQUE,
  community_token_used_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id)
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id),
  amount_bdt INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'bank_transfer')),
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  sender_mobile VARCHAR(20) NOT NULL,
  screenshot_url TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  approved_at TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_percent NUMERIC(5, 2),
  discount_fixed_bdt INTEGER,
  scope VARCHAR(50) NOT NULL CHECK (scope IN ('global', 'course_specific')),
  applicable_courses UUID[],
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Special Pricing Table
CREATE TABLE IF NOT EXISTS special_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  special_price_bdt INTEGER NOT NULL,
  original_price_bdt INTEGER NOT NULL,
  reason TEXT,
  valid_until TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id)
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('mcq', 'written', 'short_answer')),
  content TEXT NOT NULL,
  explanation TEXT,
  solution TEXT,
  difficulty_level VARCHAR(50) NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  subject VARCHAR(100),
  topic VARCHAR(100),
  exam_year INTEGER,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Question Options Table
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_label VARCHAR(10) NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  exam_type VARCHAR(50) NOT NULL CHECK (exam_type IN ('mcq', 'written', 'combined')),
  total_questions INTEGER,
  total_marks INTEGER,
  passing_marks INTEGER,
  negative_marking NUMERIC(3, 2),
  window_start_at TIMESTAMP NOT NULL,
  window_end_at TIMESTAMP NOT NULL,
  individual_duration_minutes INTEGER NOT NULL,
  shuffle_questions BOOLEAN DEFAULT false,
  show_answers_after BOOLEAN DEFAULT true,
  instructions TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam Questions Table
-- Assigns ordered questions to a specific exam.
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  marks NUMERIC(6, 2) DEFAULT 1,
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (exam_id, question_id),
  UNIQUE (exam_id, sequence_order)
);

-- Exam Attempts Table
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id),
  student_id UUID NOT NULL REFERENCES users(id),
  roll_number VARCHAR(10),
  status VARCHAR(50) NOT NULL CHECK (status IN ('in_progress', 'submitted', 'evaluated')),
  started_at TIMESTAMP NOT NULL,
  submitted_at TIMESTAMP,
  total_questions_attempted INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_wrong INTEGER DEFAULT 0,
  total_unanswered INTEGER DEFAULT 0,
  mcq_marks_obtained NUMERIC(10, 2),
  written_marks_obtained NUMERIC(10, 2),
  total_marks_obtained NUMERIC(10, 2),
  final_rank INTEGER,
  is_official BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answers Table
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_option_id UUID REFERENCES question_options(id),
  answer_text TEXT,
  is_correct BOOLEAN,
  marked_for_review BOOLEAN DEFAULT false,
  answered_at TIMESTAMP,
  time_spent_seconds INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (attempt_id, question_id)
);

-- Submission Acknowledgments Table
CREATE TABLE IF NOT EXISTS submission_acknowledgments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id),
  exam_id UUID NOT NULL REFERENCES exams(id),
  student_id UUID NOT NULL REFERENCES users(id),
  roll_number VARCHAR(10),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'evaluated', 'published')),
  submission_platform VARCHAR(50),
  submission_url TEXT,
  submitted_at TIMESTAMP,
  acknowledged_at TIMESTAMP,
  marks_entered_by UUID REFERENCES users(id),
  marks_entered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video Assets Table
CREATE TABLE IF NOT EXISTS video_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('youtube', 'bunny', 'other')),
  provider_video_id VARCHAR(255) NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  sequence_order INTEGER,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboards Table
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id),
  student_id UUID NOT NULL REFERENCES users(id),
  rank INTEGER NOT NULL,
  total_marks NUMERIC(10, 2),
  accuracy_percent NUMERIC(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (exam_id, student_id)
);

-- Performance Stats Table
CREATE TABLE IF NOT EXISTS performance_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  total_exams_attempted INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_wrong_answers INTEGER DEFAULT 0,
  overall_accuracy_percent NUMERIC(5, 2),
  current_rank INTEGER,
  average_marks NUMERIC(10, 2),
  exam_streak INTEGER DEFAULT 0,
  last_exam_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (student_id, course_id)
);

-- Books Table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  description TEXT,
  price_bdt INTEGER,
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id),
  book_id UUID NOT NULL REFERENCES books(id),
  quantity INTEGER NOT NULL,
  total_price_bdt INTEGER,
  payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  shipping_status VARCHAR(50) NOT NULL CHECK (shipping_status IN ('pending', 'shipped', 'delivered', 'cancelled')),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(100),
  related_entity_id VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  browser VARCHAR(100),
  os VARCHAR(100),
  device_fingerprint VARCHAR(255),
  ip_address INET,
  location_approximate VARCHAR(255),
  last_active_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Community Tokens Table
CREATE TABLE IF NOT EXISTS community_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES course_enrollments(id),
  token VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('unused', 'used', 'invalid')),
  used_at TIMESTAMP,
  used_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_course_categories_slug ON course_categories(slug);
CREATE INDEX idx_course_enrollments_student_id ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_payments_enrollment_id ON payments(enrollment_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_exam_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_answers_attempt_question ON answers(attempt_id, question_id);
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- Row-Level Security (RLS) - Enable for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- RLS Policy Examples (to be expanded)
-- Students can only view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Students can only view their own enrollments
CREATE POLICY "enrollments_select_own" ON course_enrollments
  FOR SELECT USING (auth.uid()::text = student_id::text);
