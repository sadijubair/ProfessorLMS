export type UserRole = 'student' | 'teacher' | 'mentor' | 'admin' | 'support' | 'super_admin';

export const ROLE_HIERARCHY = {
  super_admin: 5,
  admin: 4,
  teacher: 3,
  mentor: 2,
  support: 2,
  student: 1,
};

export const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  super_admin: new Set([
    // Users
    'users:read:all',
    'users:create',
    'users:update',
    'users:delete',
    'users:assign_role',

    // Courses
    'courses:read:all',
    'courses:create',
    'courses:update',
    'courses:delete',

    // Exams
    'exams:read:all',
    'exams:create',
    'exams:update',
    'exams:delete',
    'exams:publish_results',

    // Analytics
    'analytics:read:all',
    'analytics:export',

    // Audit
    'audit:read:all',
    'audit:export',

    // System
    'system:settings:update',
    'system:maintenance',
  ]),

  admin: new Set([
    // Users
    'users:read:all',
    'users:create',
    'users:update',
    'users:assign_role', // Cannot assign super_admin

    // Courses
    'courses:read:all',
    'courses:create',
    'courses:update',
    'courses:delete',

    // Exams
    'exams:read:all',
    'exams:create',
    'exams:update',
    'exams:delete',
    'exams:publish_results',

    // Payments
    'payments:approve',
    'payments:reject',
    'payments:read:all',

    // Analytics
    'analytics:read:all',
    'analytics:export',

    // Audit
    'audit:read:all',

    // Finance
    'finance:reports:read',
    'finance:revenue:view',
  ]),

  teacher: new Set([
    // Courses (own only)
    'courses:read:own',
    'courses:create',
    'courses:update:own',

    // Exams (own course)
    'exams:read:own',
    'exams:create:own',
    'exams:update:own',
    'exams:publish_results:own',

    // Questions
    'questions:create:own',
    'questions:update:own',
    'questions:read:own_course',
    'questions:bulk_import:own',

    // Marks Entry
    'marks:enter',
    'marks:update:own',

    // Students
    'students:view:own_course',
    'students:performance:view',

    // Announcements
    'announcements:create:own',
  ]),

  support: new Set([
    // Payments
    'payments:read:all',
    'payments:approve',
    'payments:reject',

    // Discounts
    'promo_codes:create',
    'special_pricing:create',

    // Enrollments
    'enrollments:read:all',
    'enrollments:activate',
    'enrollments:deactivate',

    // Community
    'community_tokens:consume',

    // Orders
    'orders:read:all',
    'orders:update_shipping_status',

    // Support Tickets
    'support:tickets:read',
    'support:tickets:respond',
  ]),

  mentor: new Set([
    // Students (own assigned students)
    'students:view:own_course',
    'students:performance:view',

    // Courses (read-only)
    'courses:read:enrolled',

    // Announcements
    'announcements:create:own',

    // Support
    'support:tickets:read',
    'support:tickets:respond',
  ]),

  student: new Set([
    // Courses
    'courses:read:enrolled',
    'courses:enroll:free',

    // Exams
    'exams:read:enrolled',
    'exams:attempt',
    'exams:view_results:own',

    // Questions
    'questions:practice:enrolled_course',

    // Analytics
    'analytics:read:own',

    // Profile
    'users:read:own',
    'users:update:own',

    // Devices
    'devices:manage:own',

    // Books
    'books:read',
    'orders:create',
  ]),
};

export const PERMISSION_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXECUTE: 'execute',
} as const;
