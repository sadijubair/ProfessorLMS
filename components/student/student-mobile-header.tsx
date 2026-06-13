'use client';

import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcher } from '@/components/theme-switcher';

export function StudentMobileHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-10 items-center justify-between gap-2">
        <SidebarTrigger className="-ml-1" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">ProfessorLMS</p>
          <p className="text-xs text-muted-foreground">Student portal</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Search">
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </Button>
        <ThemeSwitcher />
        <Avatar className="h-8 w-8 border">
          <AvatarImage src="/avatars/shadcn.jpg" alt="Student avatar" />
          <AvatarFallback>ST</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
