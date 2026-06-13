"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  LayoutDashboard,
  BookMarked,
  Users,
  DollarSign,
  MessageSquare,
  Layers,
  ShoppingCart,
  UserCheck,
  MailPlus,
  ClipboardList,
} from "lucide-react"

import { NavMain } from "@/components/admin/nav-main"
import { NavProjects } from "@/components/admin/nav-projects"
import { NavUser } from "@/components/admin/nav-user"
import { SidebarBranding } from "@/components/admin/sidebar-branding"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "ProfessorLMS",
    email: "admin@professorlms.local",
    avatar: "",
  },
  teams: [
    {
      name: "ProfessorLMS",
      logo: GalleryVerticalEnd,
      plan: "Admin",
    },
    {
      name: "Academic Ops",
      logo: AudioWaveform,
      plan: "Teacher",
    },
    {
      name: "Support Desk",
      logo: Command,
      plan: "Support",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Commerce",
      url: "/admin/commerce",
      icon: BookMarked,
    },
    {
      title: "Course Category",
      url: "/admin/course-categories",
      icon: Layers,
    },
    {
      title: "Course",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Manage Courses",
          url: "/admin/courses",
        },
        {
          title: "Question Bank",
          url: "/admin/questions",
        },
        {
          title: "Add New Course",
          url: "/admin/courses/create",
        },
        {
          title: "Promo Code",
          url: "#",
        },
      ],
    },
    {
      title: "Student Enrollment",
      url: "#",
      icon: UserCheck,
      items: [
        {
          title: "Enrollment History",
          url: "/admin/enrollments",
        },
        {
          title: "Enroll Student",
          url: "#",
        },
      ],
    },
    {
      title: "Exam Engine",
      url: "/admin/exams",
      icon: ClipboardList,
    },
    {
      title: "Ebook",
      url: "#",
      icon: BookMarked,
      items: [
        {
          title: "Manage Ebook",
          url: "#",
        },
        {
          title: "Add New Ebook",
          url: "#",
        },
        {
          title: "Category",
          url: "#",
        },
      ],
    },
    {
      title: "Book Shops",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "Manage Books",
          url: "#",
        },
        {
          title: "Add New Books",
          url: "#",
        },
        {
          title: "Authors",
          url: "#",
        },
        {
          title: "Publishers",
          url: "#",
        },
        {
          title: "Manage Stocks",
          url: "#",
        },
        {
          title: "Revenue",
          url: "#",
        },
      ],
    },
    {
      title: "Payment Reports",
      url: "#",
      icon: DollarSign,
      items: [
        {
          title: "Payment History",
          url: "/admin/payments",
        },
        {
          title: "Audit Logs",
          url: "/admin/audit-logs",
        },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Admin",
          url: "/admin/users/admins",
        },
        {
          title: "Instructor",
          url: "/admin/users/instructors",
        },
        {
          title: "Mentor",
          url: "/admin/users/mentors",
        },
        {
          title: "Student",
          url: "/admin/users/students",
        },
        {
          title: "Support Staff",
          url: "/admin/users/support-staff",
        },
      ],
    },
    {
      title: "Newsletter",
      url: "#",
      icon: MailPlus,
      items: [
        {
          title: "Manage Newsletters",
          url: "#",
        },
        {
          title: "Subscribed Users",
          url: "#",
        },
      ],
    },
    {
      title: "Customer Support",
      url: "#",
      icon: MessageSquare,
      items: [
        {
          title: "Tickets",
          url: "#",
        },
        {
          title: "Add New Ticket",
          url: "#",
        },
        {
          title: "FAQ",
          url: "#",
        },
        {
          title: "Report",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
          items: [
            {
              title: "Ticket Macros",
              url: "#",
            },
            {
              title: "Ticket Categories",
              url: "#",
            },
            {
              title: "Ticket Priorities",
              url: "#",
            },
            {
              title: "Ticket Status",
              url: "#",
            },
          ],
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarBranding />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
