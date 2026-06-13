ProfessorLMS
Complete Master Plan & System Architecture
Competitive Exam SaaS + Educational ERP + Learning Ecosystem

Field	Detail
Platform Name	ProfessorLMS
Category	Competitive Exam SaaS + Educational ERP
Primary Market	Bangladesh — BCS, Bank Jobs, Admission, Academic
Tech Stack	Next.js · Supabase · Vercel · Tailwind · shadcn/ui
Document Version	v2.0 — Revised Master Plan

 
1. Introduction & Platform Philosophy
ProfessorLMS is not a traditional LMS. It is a modern educational ecosystem built around assessment-first learning, targeting students preparing for competitive examinations in Bangladesh.

Core Focus Areas

•	BCS Preparation
•	Bank Job Preparation
•	Government Job Preparation
•	Admission Tests
•	Academic & Skill-based Preparation

Platform Philosophy: Learning Through Assessment

The main value of the platform is delivered through live exams, practice systems, progress tracking, rankings, and performance analytics. Video content is secondary. The platform should feel like a modern Educational SaaS product — not a coaching center website or a Bootstrap admin panel.

2. Technology Stack
Layer	Technology & Purpose
Frontend Framework	Next.js — SSR, routing, middleware, layouts, SEO
Styling	Tailwind CSS — responsive design, utility-first system
Component System	shadcn/ui — dashboards, tables, dialogs, forms, sheets
Animation	Framer Motion — transitions, micro-interactions, page animations
Backend / Database	Supabase (Pro Plan) — PostgreSQL, auth, APIs, storage, realtime, RLS
Hosting	Vercel — frontend hosting, edge deployment, CDN, image optimization
Video Hosting	YouTube Unlisted — streaming, bandwidth reduction (2-year strategy)
Live Classes	Zoom / Google Meet / Microsoft Teams (external)
Icons	Lucide Icons
Charts & Analytics	Recharts

Infrastructure Note: Supabase Pro Plan Required

Supabase free tier has a 1-2 second cold start delay due to instance spin-down. Upgrading to the Pro plan ($25/month) eliminates this completely and is essential for a production exam platform where timing is critical. No comparable free alternative provides equivalent features (auth + PostgreSQL + realtime + storage + RLS in one platform).

Video Strategy: YouTube Unlisted (2-Year Plan)

YouTube Unlisted is the primary video delivery method for cost efficiency. The following safeguards must be implemented:

•	Store all YouTube video IDs in the database (never hardcode in frontend)
•	All videos embedded via the platform player only — no direct YouTube links exposed to students
•	Player wrapped with dynamic watermark overlay (see Anti-Piracy System)
•	Video metadata (title, duration, thumbnail) cached in DB — enables provider swap without content restructuring
•	Migration path: Bunny.net ($0.01/GB) identified as future provider when scaling requires it

 
3. Domain, URL & Application Structure
3.1 Domain Structure
Domain	Purpose
domain.com	Student portal, public pages, public visitor access
admin.domain.com	Admin, Teacher, Support Staff portal

Important: This is NOT two separate applications. It is one Next.js application with different routes, layouts, middleware, and permission layers. The subdomain separation is handled via middleware routing.

3.2 Application Folder Structure
app/
  ├── (public)/          # Landing, marketing, public exam listings
  ├── (dashboard)/       # Student dashboard & all student features
  ├── (admin)/           # Admin + Teacher + Support portals
  ├── api/               # API routes
  ├── components/        # Shared UI components
  ├── lib/               # Utilities, helpers, constants
  ├── hooks/             # Custom React hooks
  ├── services/          # Business logic layer
  └── middleware/        # Auth, RBAC, subdomain routing

 
4. Role-Based Access Control (RBAC)
4.1 Role Definitions
Role	Access Level & Responsibilities
super_admin	Developer-level god mode. Full system access including database moderation, system settings, raw data operations, role assignment, audit log access, and all admin capabilities. Only assigned to platform developers/owners.
admin	Full operational control — analytics, user management, role management (except super_admin), finance, reports, security monitoring, platform settings. Cannot perform database-level operations.
teacher	Course management, exam creation, question management, written marks entry, announcements, class links, student performance monitoring.
support	Payment approval, discount creation, special pricing, enrollment management, Facebook verification, book order management, support tickets.
student	Course access, exam participation, question bank practice, analytics, results, leaderboards, profile, payments, bookstore.

4.2 Future Roles (Planned)
•	examiner — dedicated written exam evaluator
•	moderator — community & content moderation
•	content_manager — question bank & resource management
•	branch_admin — future franchise/branch system management

5. Authentication System
5.1 Login Methods
Method	Details
Google OAuth	Primary recommended login method
Email + Password	Standard credential login
Mobile + Password	Mobile number as username

5.2 Account Rules
•	One mobile number = one account (duplicates blocked)
•	One email = one account (duplicates blocked)
•	One identity per student — no multiple accounts

6. Device Management & Session Security
Policy: Maximum 2 Active Devices Per Account

6.1 Device Login Rules
•	One account can be logged in on a maximum of 2 devices simultaneously
•	A 3rd device attempting login is blocked immediately
•	The blocked screen displays a clear message — no device management options shown

6.2 Blocked Screen Message
Device Limit Reached

Your account is already active on 2 devices. To log in on this device, please open your dashboard on an existing logged-in device, go to Settings > Devices, and remove one active device.

6.3 Device Removal Flow
•	Student logs into an existing active device
•	Goes to Dashboard > Settings > Device Management
•	Sees list of active devices (device name, browser, last active time, location approximate)
•	Removes one device from the list
•	3rd device can now attempt login successfully

Security rationale: Requiring device removal from an existing active session prevents credential thieves from remotely locking out the original account owner.

 
7. Student Identity System
7.1 Permanent Student ID
Property	Detail
Format	YY + 6 random digits (e.g., 26182734)
Generation	At registration — immediately and permanently assigned
Uniqueness	Globally unique across all students
Permanence	Never changes — persists for lifetime of account
Limit	One per student — no duplicates possible

7.2 Roll Number System
Roll numbers are generated after successful enrollment (payment approved + enrollment activated).

Property	Detail
Scope	One roll number per enrollment (course-specific)
Uniqueness	Globally unique — no two students share a roll number across any course
Example	Student 26182734 enrolled in BCS Course → Roll: 582941; enrolled in Bank Course → Roll: 834152

8. Community Verification System
Each enrollment generates a one-time verification token used for Facebook group and Telegram verification by support staff.

Property	Rule
Generation	Automatically on enrollment activation
Usage	Single-use only — consumed on first verification
Scope	Enrollment-specific — one token per course enrollment
Reuse	Cannot be reused after consumption

8.1 Verification Workflow
•	Student requests Facebook group or Telegram access
•	Student submits their Facebook profile link to support
•	Support staff verifies enrollment status in the system
•	Support consumes the one-time token and approves group request
•	Token marked as used — cannot be reused

Community Offboarding: When a student is unenrolled or banned, support staff must be notified via the system to manually revoke community access. Token status is flagged as invalid.

 
9. Course System
9.1 Course Types
Type	Features
Premium Guided:	Support included, Facebook group, Google Classroom, live exams, written evaluation, teacher interaction — full service
Self-Paced:	Recorded materials, practice exams, question bank, self-learning. No support, no Facebook group, no classroom, no written support.
Free:	Auto-enrollment, no payment verification, instant access. Used for lead generation, marketing, and student onboarding.

9.2 Course Configuration Flags
is_free
is_self_paced
has_support
has_facebook_group
has_google_classroom
has_live_exam
has_written_exam
requires_manual_payment

10. Enrollment & Payment System
Payment Strategy: Manual Verification (Optimized for 300-500 Transactions/Month)

10.1 Enrollment Flows
Course Type	Enrollment Flow
Free Course	Student clicks enroll → Auto-enrolled instantly → Access granted
Paid Course	Student submits payment → Support verifies manually → Enrollment activated → Roll generated → Token generated

10.2 Accepted Payment Methods
•	bKash
•	Nagad
•	Rocket
•	Bank Transfer

Note: No payment gateway integration in initial phase. Manual verification is appropriate and operationally efficient at the 300-500 monthly transaction volume for the first 6 months.

10.3 Payment Submission (Student)
•	Transaction ID
•	Sender mobile number
•	Payment screenshot (uploaded)
•	Amount paid

10.4 Payment Verification (Support/Admin)
•	Support staff reviews submission
•	Verifies transaction ID against records — duplicate IDs blocked system-wide
•	Approves or rejects with reason
•	On approval: enrollment activated instantly, roll generated, community token generated
•	On rejection: student notified with reason via in-app notification

10.5 Payment Security
•	One transaction ID = one use only (system-enforced)
•	Duplicate transaction blocked immediately on submission
•	Transaction ID reserved on submission — prevents race conditions
•	Screenshot required as secondary verification
•	Sender number validated against submission

 
11. Discount System
Type	Description
Global Promo Codes	Platform-wide codes (e.g., EID2026) — anyone can use during validity period
Course Discounts	Public sale pricing applied to a specific course for a date range
Student-Specific Pricing	Financial assistance pricing — linked to student_id + course_id — only visible to that student. Example: Normal ৳2000 → Special ৳500

12. Exam Engine
12.1 Exam Types
Type	Description
MCQ Exam	Fully online — timer, navigator, auto-evaluation, instant results
Written Exam	Question download + offline writing + external submission (Google Classroom / Drive / Teams) + manual marks entry by teacher/examiner
Combined Exam	MCQ section (auto-evaluated online) + Written section (external submission, manual marks) → Final result published after written evaluation

12.2 Exam Time System
Every exam has two time constraints that work together:

Parameter	Description
Global Timeframe (Window)	The overall exam window (e.g., 9:00 PM → 11:00 PM). Exams cannot be started or submitted outside this window.
Individual Duration	Maximum time a student gets after starting (e.g., 20 minutes)
Final Time Rule	Student gets MIN(individual_duration, remaining_window_time)

Example: Student starts at 10:50 PM. Window ends at 11:00 PM. Individual duration = 20 minutes.
Student receives: MIN(20 min, 10 min remaining) = 10 minutes only.

12.3 Auto-Submit Conditions
•	Student manually submits early
•	Individual duration timer expires
•	Exam window ends — all active attempts auto-submitted

12.4 MCQ Features
•	Live countdown timer
•	Question navigator panel
•	Auto-save on every answer change
•	Negative marking (admin-configurable — e.g., Correct +1, Wrong -0.25)
•	Instant evaluation after submission
•	Post-window: answers, explanations, solutions, rankings visible

12.5 Result Publishing
Phase	Visibility
During Window	Results hidden — no answers or rankings visible
After Window Closes	Answers, explanations, solutions, rankings, merit list all published

12.6 Practice Mode
After the official exam window closes, all MCQ exams automatically become available as practice exams:

•	Unlimited retries allowed
•	Practice attempts do not affect official leaderboard or rankings
•	Original official result unchanged
•	Used for revision and weak area improvement

12.7 Written Exam Workflow
•	Exam window opens → student downloads question paper from platform
•	Student writes answers offline
•	Student submits externally via Google Classroom / Drive / Teams
•	Student confirms submission inside ProfessorLMS (timestamp recorded) — creates an internal submission acknowledgment record
•	Teacher/examiner evaluates submitted work externally
•	Teacher manually enters marks in ProfessorLMS Teacher Portal
•	Admin publishes results — questions locked until admin publishes solution

Submission Acknowledgment: The in-platform confirmation step (student marks 'I have submitted') creates a critical audit trail linking the external submission to the student's roll number, even before marks are entered.

 
13. Question Bank System
13.1 Question Entry Methods
Method	Details
One-by-One Entry	Teacher/Admin adds individual questions via form in the portal
Bulk Import via CSV/Excel	Upload CSV or Excel file with predefined column format — system parses and imports in batch. Ideal for adding previous year BCS/Bank exam question sets.

13.2 Practice Modes
•	Topic practice — filter by subject and topic
•	Timed practice — simulate exam conditions
•	Random practice — mixed question set
•	Weak area practice — AI-targeted (Phase 5)
•	Previous year practice — filter by exam year

13.3 Question Filters
•	Subject / Topic
•	Difficulty level
•	Exam year
•	Solved / Unsolved status

14. Analytics & Leaderboard System
14.1 Student Analytics
•	Rank trend over time
•	Subject-wise performance breakdown
•	Weak area identification
•	Answer accuracy rate
•	Speed (questions per minute)
•	Exam streak tracking
•	Full exam history

14.2 Leaderboard Types
Type	Scope
Exam Leaderboard	Rankings for a specific exam attempt
Weekly Leaderboard	Aggregated weekly performance
Monthly Leaderboard	Aggregated monthly performance
Batch Leaderboard	Rankings within a specific course batch

Only official exam attempts count toward leaderboards. Practice mode attempts are excluded entirely.

15. Notification System
Delivery: In-App Notifications Only

Major announcements, exam reminders, and community updates are communicated via Facebook Group and Telegram Group managed by admin. ProfessorLMS handles transactional notifications in-app only.

15.1 In-App Notification Triggers
•	Exam reminder (upcoming exam in course)
•	Result published (exam results now available)
•	Payment approved / rejected (with reason on rejection)
•	Enrollment activated
•	Support message response
•	New announcement from teacher/admin
•	New resource or class link added to course

 
16. Security & Anti-Piracy System
16.1 Platform Security
•	RBAC permission enforcement at middleware level
•	Row-Level Security (RLS) in Supabase — database-level access control
•	Rate limiting on API routes
•	Admin and teacher route protection via middleware
•	Session monitoring and suspicious login detection
•	OTP required for new device login

16.2 Device & Session Security
•	Maximum 2 concurrent active sessions per account
•	Session tracking per device with device fingerprinting
•	3rd device blocked — user must remove existing device from active session
•	Active session list visible to student in Dashboard > Settings > Devices

16.3 Anti-Piracy: Video Protection
•	All videos served via embedded YouTube player only — no direct links
•	Dynamic watermark overlay on every video:
◦	Student Name + Student ID + Mobile Number + Timestamp
•	YouTube IDs stored in database — player fetches ID, never exposes YouTube URL directly
•	No download links provided anywhere on the platform

16.4 Audit Logs (Core System — Day One)
Audit logs are a core database table, not a future feature

All sensitive operations are logged immutably. Minimum required audit events:

•	Payment approvals and rejections (who approved, timestamp, transaction ID)
•	Marks entry (teacher ID, original value, edited value, timestamp)
•	Enrollment activations and deactivations
•	Role assignments and changes
•	Discount and special pricing creation
•	Admin-level system setting changes
•	Token consumption for community verification

17. Database Architecture
17.1 Core Tables
Table	Purpose
users	All users across all roles
roles / permissions	RBAC role and permission definitions
audit_logs	Immutable log of all sensitive operations (core table — not optional)
courses	Course definitions and configuration flags
course_enrollments	Student-course enrollment records with roll numbers
payments	Payment submissions and verification status
promo_codes	Global promo codes and validity
special_pricing	Student-specific pricing (student_id + course_id)
questions	Question bank entries
question_options	MCQ answer options per question
exams	Exam definitions, timeframes, configuration
exam_attempts	Student exam attempt records and state
answers	Student answers per attempt
submission_acknowledgments	Written exam internal submission confirmations
video_assets	YouTube video IDs and metadata (provider-agnostic)
leaderboards	Computed leaderboard entries per exam
performance_stats	Aggregated per-student analytics
books	Bookstore product catalog
orders	Book purchase orders
notifications	In-app notification records
devices	Active device sessions per user
community_tokens	One-time verification tokens per enrollment

 
18. Portal & Dashboard System
18.1 Student Dashboard
•	Continue learning (last accessed course/material)
•	Upcoming exams with countdown
•	Live exams (currently active)
•	Performance overview (rank, accuracy, streak)
•	Weak area summary
•	Notices and announcements
•	Course progress indicators

18.2 Teacher Dashboard
•	Exam management (create, schedule, publish results)
•	Course management
•	Written marks entry panel
•	Question bank management (one-by-one + bulk import)
•	Announcements and class links
•	Student performance monitoring

18.3 Support Dashboard
•	Payment approval queue
•	Discount and special pricing management
•	Enrollment management
•	Community verification requests
•	Book order management
•	Support ticket responses

18.4 Admin Dashboard
•	All teacher and support features
•	Platform-wide analytics
•	User and role management
•	Audit log viewer
•	Finance and revenue reports
•	Security monitoring
•	Platform configuration settings

18.5 Super Admin
•	Everything admin has access to
•	Database-level moderation and operations
•	System health and infrastructure monitoring
•	Role assignment including admin role
•	Platform-wide emergency controls
•	Raw audit log access with export

19. Book Store System
Integrated bookstore for company-published books and study materials only.

Feature	Detail
Product Types	Printed books, notes, study materials (optional PDFs in future)
Payment	Manual verification (same system as course payment)
Order Management	Support staff handles order processing and shipping status
Discounts	Bundle discounts and promo code support

 
20. Development Roadmap
Phase ordering prioritizes revenue flow before feature depth

Phase 1 — Foundation & Revenue Flow
Component	Details
Authentication	Google OAuth, Email+Password, Mobile+Password, device management (2-device limit)
Role System	RBAC with all 5 roles, middleware protection, Supabase RLS
Student Identity	Permanent Student ID generation, account rules enforcement
Course System	Course creation, configuration flags, free course auto-enrollment
Manual Payment	Payment submission, support verification workflow, enrollment activation
Audit Logs	Core audit_log table wired to all payment and enrollment events
Basic Dashboards	Minimal student and support dashboards to operate

Phase 2 — Exam Engine
Component	Details
MCQ Exam System	Full timer, navigator, auto-save, negative marking, auto-submit
Timing Logic	Global window + individual duration, MIN() rule, window auto-submit
Result System	Post-window result publishing, explanations, solutions
Practice Mode	Unlimited retries after window closes, isolated from official results
Leaderboard	Exam, weekly, monthly, batch leaderboards — official attempts only

Phase 3 — Analytics & Question Bank
Component	Details
Student Analytics	Rank trends, subject performance, weak areas, accuracy, speed, streaks
Dashboard Widgets	Charts, progress rings, activity graphs (Recharts)
Question Bank	One-by-one entry + bulk CSV/Excel import, filters, practice modes

Phase 4 — Written Workflow & Commerce
Component	Details
Written Exam	Question download, submission acknowledgment, marks entry, combined results
Book Store	Product catalog, order management, shipping status
Promo Codes	Global codes, course discounts, student-specific special pricing
Community System	Verification token generation and consumption workflow

Phase 5 — Advanced Features
Component	Details
AI Analytics	Weak area analysis, performance recommendations
AI Recommendation	Personalized question and study path suggestions
Advanced Reports	Finance, enrollment, performance reports with export
Mobile App	React Native or PWA based on usage data
Streaks System	Daily practice streaks and engagement mechanics

21. UI/UX Philosophy & Design System
ProfessorLMS must feel like a Modern Educational SaaS — not a coaching center portal

21.1 Design Principles
•	Mobile-first — primary users are on mobile devices
•	Dark/light mode support
•	Minimal layout with large typography
•	Analytics-first UI — data and progress always prominent
•	Smooth micro-animations (Framer Motion) without being distracting
•	Clean spacing and modern cards
•	Fast loading — optimized for Bangladesh mobile network conditions

21.2 UI Component Stack
•	shadcn/ui — all dashboard components, tables, dialogs, forms
•	Lucide Icons — consistent icon system
•	Recharts — all analytics charts and graphs
•	Framer Motion — page transitions and micro-interactions
•	Tailwind CSS — responsive design system

 
22. Future Expansion Roadmap
Feature	Notes
Mobile App	Native app (React Native) or PWA — decision based on Phase 5 usage data
AI Analytics	Weak area analysis, personalized recommendations
AI Recommendation System	Study path and question recommendations
Advanced Reports	Finance, enrollment, performance exports
Franchise / Branch System	branch_admin role, multi-branch analytics
Instructor Payouts	Revenue sharing for freelance instructors
Video Migration	Bunny.net as provider when YouTube limitations require it — video_assets table enables zero-downtime migration
Payment Gateway	bKash/SSLCommerz API integration when monthly transactions exceed manual capacity

23. Final Platform Vision & Competitive Strategy
Educational ERP + Competitive Exam SaaS
The platform experience itself becomes the competitive advantage.

23.1 Competitive Differentiation
•	Better UX — cleaner, faster, more intuitive than existing BD EdTech platforms
•	Better analytics — students see their growth clearly, motivating continued engagement
•	Better exam experience — timing system, auto-save, practice mode
•	Mobile-first design — built for how Bangladeshi students actually use the internet
•	Operational efficiency — RBAC, audit logs, device management reduce admin overhead

23.2 NOT Competing On
•	Content quantity alone — quality of assessment experience wins
•	Feature quantity — focused feature set done well beats bloated platforms



ProfessorLMS — Revised Master Plan v2.0
