import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { StudentAppSidebar } from '@/components/student/student-app-sidebar';
import { StudentHeader } from '@/components/student/student-header';
import { StudentMobileHeader } from '@/components/student/student-mobile-header';
import { StudentMobileNav } from '@/components/student/student-mobile-nav';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        {/* Sidebar - Visible on desktop, collapsible on mobile */}
        <StudentAppSidebar />

        <div className="flex w-full flex-1 flex-col bg-muted/25">
          {/* Mobile Header with Sidebar Toggle */}
          <div className="md:hidden">
            <StudentMobileHeader />
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <StudentHeader />
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>

          {/* Mobile Navigation */}
          <StudentMobileNav />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
