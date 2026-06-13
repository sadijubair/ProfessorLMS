import { AppSidebar } from '@/components/admin/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { AdminAvatarMenu } from '@/components/admin/avatar-menu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <AdminAvatarMenu />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
