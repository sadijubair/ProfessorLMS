'use client';

import {
  IconDashboard,
  IconBooks,
  IconFileText,
  IconClock,
  IconBolt,
  IconCheckbox,
  IconChartBar,
  IconCreditCard,
  IconUser,
  IconSettings,
  IconLogout,
  IconSchool,
  IconTrophy,
} from '@tabler/icons-react';

import { StudentNavMain } from '@/components/student/student-nav-main';
import { StudentNavSecondary } from '@/components/student/student-nav-secondary';
import { StudentNavUser } from '@/components/student/student-nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const studentData = {
  user: {
    name: 'Mohammad',
    email: 'student@university.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Commerce',
      url: '/dashboard/commerce',
      icon: IconBooks,
    },
    {
      title: 'Courses',
      url: '/dashboard/courses',
      icon: IconBooks,
    },
    {
      title: 'Lessons',
      url: '/dashboard/lessons',
      icon: IconFileText,
    },
    {
      title: 'Past Exams',
      url: '/exams',
      icon: IconClock,
    },
    {
      title: 'Practice Exams',
      url: '/exams',
      icon: IconBolt,
    },
    {
      title: 'Question Practice',
      url: '/dashboard/practice',
      icon: IconFileText,
    },
    {
      title: 'Leaderboards',
      url: '/dashboard/leaderboards',
      icon: IconTrophy,
    },
    {
      title: 'Solve Sheets',
      url: '/dashboard/solve-sheets',
      icon: IconCheckbox,
    },
    {
      title: 'Performance',
      url: '/dashboard/performance',
      icon: IconChartBar,
    },
    {
      title: 'Payments',
      url: '/dashboard/payments',
      icon: IconCreditCard,
    },
    {
      title: 'My Account',
      url: '/dashboard/account',
      icon: IconUser,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: IconSettings,
    },
    {
      title: 'Logout',
      url: '/api/auth/logout',
      icon: IconLogout,
    },
  ],
};

export function StudentAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="border-sidebar-border" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-12 rounded-lg px-2 text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <a href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                  <IconSchool className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ProfessorLMS</span>
                  <span className="text-xs text-sidebar-foreground/55">Student Portal</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <div className="mx-3 mb-2 rounded-lg border border-sidebar-border/70 bg-white/5 p-3 group-data-[collapsible=icon]:hidden">
          <p className="text-xs font-medium text-sidebar-foreground/55">Today</p>
          <p className="mt-1 text-sm font-semibold text-sidebar-foreground">1 class, 1 exam</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div className="h-full w-[68%] rounded-full bg-sidebar-primary" />
          </div>
        </div>
        <StudentNavMain items={studentData.navMain} />
        <StudentNavSecondary items={studentData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 p-3">
        <StudentNavUser user={studentData.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
