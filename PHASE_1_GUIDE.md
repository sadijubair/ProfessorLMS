# Phase 1 Implementation Guide
## Foundation & Revenue Flow

## Overview
Phase 1 establishes the core infrastructure needed to launch ProfessorLMS with revenue generation capability. This includes authentication, RBAC system, student identity generation, course enrollment, and manual payment verification.

---

## 1. Supabase Setup & Database

### Steps:
1. **Create Supabase Project**
   - Go to https://supabase.com and create a new project
   - Choose "Pro" plan ($25/month) to avoid cold start delays
   - Select Bangladesh region if available, otherwise closest region

2. **Database Configuration**
   - Copy the SQL schema from `lib/db/schema.sql`
   - Execute the entire schema in Supabase SQL Editor
   - Verify all tables are created
   - Enable Row-Level Security (RLS) on sensitive tables

3. **API Keys**
   - Copy `NEXT_PUBLIC_SUPABASE_URL` from Supabase project settings
   - Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` from API Keys section
   - Copy `SUPABASE_SERVICE_ROLE_KEY` from API Keys section
   - Add to `.env.local`

### Schema Tables (23 core tables):
- ✅ users, roles, permissions
- ✅ audit_logs (core - Day One)
- ✅ courses, course_enrollments
- ✅ payments, promo_codes, special_pricing
- ✅ questions, question_options, exams, exam_attempts, answers
- ✅ submission_acknowledgments, video_assets
- ✅ leaderboards, performance_stats
- ✅ books, orders
- ✅ notifications, devices, community_tokens

---

## 2. Authentication System

### Current Status:
- ✅ Supabase client configured (`lib/db/supabase.ts`)
- ✅ Auth utilities created (`lib/auth/auth.ts`)
- ✅ Login & signup pages created (basic UI)

### TODO - Complete Implementation:

**A. Email + Password Authentication**
- [ ] Integrate Supabase Auth signUp() method in signup API
- [ ] Implement email verification flow
- [ ] Hash passwords before storage (use bcryptjs in API routes)
- [ ] Create login API route using signInWithPassword()
- [ ] Implement "forgot password" flow

**B. Mobile + Password Authentication**
- [ ] Create mobile login variant in signup form
- [ ] Validate mobile number format (Bangladesh: 01XXXXXXXXX)
- [ ] Enforce unique mobile per account
- [ ] Add mobile login option to login form

**C. Google OAuth (Recommended)**
- [ ] Get Google OAuth credentials from Google Cloud Console
- [ ] Add to `.env.local`:
  ```
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
  GOOGLE_CLIENT_SECRET=xxx
  ```
- [ ] Integrate `signInWithOAuth()` with Google provider
- [ ] Add "Sign in with Google" button to login/signup

**D. Session & Cookies**
- [ ] Implement session persistence using httpOnly cookies
- [ ] Add logout functionality
- [ ] Create middleware for session validation
- [ ] Implement refresh token rotation

**E. Device Management (2-Device Limit)**
- [ ] Register device on login (`registerDevice()` in auth.service.ts)
- [ ] Check active device count before login
- [ ] Show blocked screen if 3rd device attempts login
- [ ] Create device management UI in settings
- [ ] Implement device removal endpoint

### Files to Update:
- `app/(public)/login/page.tsx` - add email/mobile/password fields + Google button
- `app/(public)/signup/page.tsx` - add validation + submit to API
- `app/api/auth/signup/route.ts` - complete implementation
- `app/api/auth/login/route.ts` - create login endpoint
- `lib/auth/auth.ts` - add Google OAuth helper functions
- Create `app/api/auth/logout/route.ts`
- Create `app/api/devices/route.ts` for device management

---

## 3. Role-Based Access Control (RBAC)

### Current Status:
- ✅ Role definitions created (`lib/auth/rbac.ts`)
- ✅ Permission mappings defined for all 5 roles

### TODO - Complete Implementation:

**A. Database Setup**
- [ ] Insert predefined roles into `roles` table:
  ```sql
  INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Developer-level god mode'),
  ('admin', 'Full operational control'),
  ('teacher', 'Course and exam management'),
  ('support', 'Payment and enrollment support'),
  ('student', 'Course access and participation');
  ```

**B. Permission Middleware**
- [ ] Update `middleware.ts` to verify role on protected routes
- [ ] Implement `checkPermission()` helper function
- [ ] Create `/api/auth/verify` endpoint for client-side role checks
- [ ] Add role-based route protection

**C. Subdomain Routing**
- [ ] Configure `domain.com` → student portal
- [ ] Configure `admin.domain.com` → admin portal
- [ ] Update middleware to route based on subdomain
- [ ] Handle local development with subdomain mapping (hosts file or proxy)

**D. Admin Dashboard Routes**
- [ ] Create route guard for admin-only pages
- [ ] Implement admin role check before serving `/admin/*` routes
- [ ] Create teacher dashboard routes
- [ ] Create support dashboard routes

### Files to Update:
- `middleware.ts` - add role verification and subdomain routing
- `lib/auth/rbac.ts` - already complete
- Create `lib/auth/permissions.ts` - permission checking functions
- Create `app/api/auth/verify/route.ts`

---

## 4. Student Identity System

### Current Status:
- ✅ `generateStudentId()` function created
- ✅ TypeScript types defined

### TODO - Complete Implementation:

**A. Student ID Generation on Registration**
- [ ] Call `generateStudentId()` in user creation flow
- [ ] Store in `users.student_id` column
- [ ] Verify uniqueness (should be automatic with UNIQUE constraint)
- [ ] Display student ID to student after registration

**B. Enrollment Data**
- [ ] Generate `roll_number` on payment approval
- [ ] Use `generateRollNumber()` function
- [ ] Store in `course_enrollments.roll_number`
- [ ] Verify global uniqueness

**C. Community Token**
- [ ] Generate on enrollment activation
- [ ] Use `generateCommunityToken()` function
- [ ] Store in `course_enrollments.community_token`
- [ ] Create `/api/community/verify-token` endpoint for support staff

### Files to Update:
- `services/auth.service.ts` - already has these functions
- Login/registration flow - call generation functions

---

## 5. Course System

### Current Status:
- ✅ Course table schema defined
- ✅ Course configuration flags created

### TODO - Complete Implementation:

**A. Course Creation (Admin/Teacher)**
- [ ] Create course creation form UI
- [ ] Create `/api/courses/create` endpoint
- [ ] Implement course slug generation (auto from title)
- [ ] Handle thumbnail upload to Supabase Storage
- [ ] Add configuration flag checkboxes (is_free, is_self_paced, etc.)

**B. Course Types Handling**
- [ ] Free course: auto-enroll on submit
- [ ] Premium Guided: manual payment + support
- [ ] Self-Paced: recorded materials + practice

**C. Course Listing**
- [ ] Create `/courses` page with course cards
- [ ] Filter by category (BCS, Bank, Admission, Academic, Skill)
- [ ] Show course type badge (Free, Premium, Self-Paced)
- [ ] Implement pagination or infinite scroll

**D. Course Detail Page**
- [ ] Create `/courses/[slug]` dynamic route
- [ ] Display course info, teacher, price, features
- [ ] "Enroll" button (triggers payment or auto-enrollment)

### Files to Create:
- `app/(public)/courses/page.tsx`
- `app/(public)/courses/[slug]/page.tsx`
- `app/api/courses/create/route.ts`
- `services/course.service.ts`

---

## 6. Manual Payment System

### Current Status:
- ✅ Payment submission API created
- ✅ `submitPayment()` service function created
- ✅ Database schema supports all payment methods

### TODO - Complete Implementation:

**A. Payment Submission (Student)**
- [ ] Create payment form UI after enrollment
- [ ] Fields: Transaction ID, Sender Mobile, Amount, Payment Screenshot
- [ ] Call `/api/payments/submit` endpoint
- [ ] Show confirmation: "Payment submitted. Awaiting verification."

**B. Payment Verification (Support)**
- [ ] Create support dashboard queue view
- [ ] List pending payments with:
  - Student name, mobile, transaction ID
  - Course, payment amount
  - Screenshot preview
  - Submit date
- [ ] "Approve" or "Reject" buttons
- [ ] Rejection reason field (required if rejecting)
- [ ] Call `/api/payments/approve` or `/api/payments/reject`

**C. Approval Workflow**
- [ ] On approval:
  - [ ] Payment status → "approved"
  - [ ] Generate roll number
  - [ ] Generate community token
  - [ ] Enrollment status → "active"
  - [ ] Log audit event
- [ ] On rejection:
  - [ ] Payment status → "rejected"
  - [ ] Send rejection reason to student in-app notification
  - [ ] Allow student to resubmit

**D. Duplicate Transaction Prevention**
- [ ] Database constraint: `transaction_id` UNIQUE
- [ ] API validation: check existing transaction before insert
- [ ] Display error: "Transaction ID already used"

### Files to Create/Update:
- `app/(student)/enrollment/payment/page.tsx`
- `app/(admin)/payments/queue/page.tsx`
- `app/api/payments/approve/route.ts`
- `app/api/payments/reject/route.ts`
- `services/payment.service.ts`

---

## 7. Audit Logging (Core - Day One)

### Current Status:
- ✅ Audit logs table created
- ✅ `logAuditEvent()` function in services

### TODO - Complete Implementation:

**A. Wire Audit Events**
- [ ] Log on user registration
- [ ] Log on payment submission
- [ ] Log on payment approval
- [ ] Log on payment rejection
- [ ] Log on enrollment activation
- [ ] Log on enrollment deactivation
- [ ] Log on course creation
- [ ] Log on role assignment

**B. Audit Log Viewer (Admin)**
- [ ] Create `/admin/audit-logs` page
- [ ] Display filterable list:
  - Action, Entity Type, User, Timestamp
  - Old Values, New Values (JSON viewer)
- [ ] Filter by date range, action, user
- [ ] Export to CSV functionality

### Files to Create:
- `app/(admin)/audit-logs/page.tsx`
- `app/api/audit-logs/search/route.ts`

---

## 8. Basic Dashboards

### Current Status:
- ✅ Student dashboard page created (placeholder)
- ✅ Admin dashboard page created (placeholder)

### TODO - Complete Implementation:

**A. Student Dashboard**
- [ ] Display student profile summary (name, ID, email)
- [ ] List enrolled courses with status
- [ ] Show upcoming exams (if Phase 2 done)
- [ ] Quick action buttons:
  - Browse more courses
  - View notifications
  - Settings

**B. Support Dashboard**
- [ ] Payment approval queue (with count)
- [ ] Recent enrollments
- [ ] Quick stats: pending payments, new enrollments today
- [ ] Quick actions: approve payment, view enrollment

**C. Admin Dashboard**
- [ ] Overall stats:
  - Total users (by role)
  - Total courses
  - Total revenue (BDT)
  - Active enrollments
- [ ] Charts (if using Recharts):
  - Enrollment trend
  - Revenue trend
  - User registration trend
- [ ] Recent activity feed
- [ ] Quick links to key features

### Files to Update:
- `app/(student)/dashboard/page.tsx`
- `app/(admin)/dashboard/page.tsx`
- `app/(admin)/support/dashboard/page.tsx`

---

## 9. Testing Checklist

- [ ] **User Registration Flow**
  - [ ] Create new student user
  - [ ] Verify student ID is generated
  - [ ] Test email validation
  - [ ] Test mobile number duplicate blocking

- [ ] **Free Course Enrollment**
  - [ ] Enroll in free course
  - [ ] Verify instant activation
  - [ ] Verify roll number generated
  - [ ] Verify community token generated

- [ ] **Paid Course Enrollment + Payment**
  - [ ] Enroll in paid course
  - [ ] Submit payment with transaction ID
  - [ ] Verify payment pending status
  - [ ] Test duplicate transaction ID blocking
  - [ ] Approve payment as support staff
  - [ ] Verify enrollment activated and tokens generated
  - [ ] Reject payment and verify student can resubmit

- [ ] **RBAC & Permissions**
  - [ ] Student cannot access admin routes
  - [ ] Teacher cannot access support admin
  - [ ] Admin can see all user data
  - [ ] Verify middleware blocks unauthorized access

- [ ] **Audit Logging**
  - [ ] Payment approval logged
  - [ ] User registration logged
  - [ ] Enrollment activation logged
  - [ ] Audit log viewer shows all events

- [ ] **Device Management**
  - [ ] Login on device 1 - success
  - [ ] Login on device 2 - success
  - [ ] Login attempt on device 3 - blocked with message
  - [ ] Remove device 1 from settings
  - [ ] Device 3 login now succeeds

---

## 10. Deployment Checklist

- [ ] **Environment Variables**
  - [ ] Set all Supabase keys in production
  - [ ] Configure Google OAuth production credentials
  - [ ] Set `NEXT_PUBLIC_APP_URL` to production domain

- [ ] **Database**
  - [ ] Run schema migration in production Supabase
  - [ ] Verify all tables created
  - [ ] Verify RLS policies enabled

- [ ] **Vercel Deployment**
  - [ ] Connect Git repository
  - [ ] Add environment variables to Vercel dashboard
  - [ ] Deploy to staging first
  - [ ] Test all flows in staging
  - [ ] Deploy to production

- [ ] **Subdomain Setup**
  - [ ] Point `domain.com` A record to Vercel
  - [ ] Point `admin.domain.com` CNAME to Vercel
  - [ ] Verify both subdomains accessible

---

## 11. Phase 1 Timeline Estimate

- **Week 1**: Supabase setup, database schema, authentication basics
- **Week 2**: RBAC middleware, student identity system, course system
- **Week 3**: Payment system, audit logging, basic dashboards
- **Week 4**: Testing, bug fixes, deployment preparation

**Total: ~4 weeks for Phase 1**

---

## 12. Success Criteria

- ✅ Users can register and login (email, mobile, Google OAuth)
- ✅ 2-device limit enforced
- ✅ Free courses auto-enroll, paid courses show payment flow
- ✅ Support staff can approve/reject payments
- ✅ Permanent student IDs assigned
- ✅ Roll numbers and community tokens generated on activation
- ✅ All sensitive operations logged in audit_logs
- ✅ RBAC prevents unauthorized access
- ✅ Dashboards display correct data per role
- ✅ Platform handles 300-500 manual payments/month efficiently

---

## Next Steps

**After Phase 1 Complete:**
1. Deploy Phase 1 to production
2. Begin Phase 2: Exam Engine (MCQ system, timing, practice mode)
3. Continue with analytics, question bank, written exams, etc.

