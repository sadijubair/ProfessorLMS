'use client';

import { Bell, CalendarDays, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export function StudentHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Plan, learn, practice, repeat</p>
        </div>

        <div className="hidden min-w-[260px] max-w-md flex-1 lg:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-lg pl-9"
              placeholder="Search courses, exams, lessons"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className="hidden h-8 gap-1.5 rounded-lg px-3 md:inline-flex">
            <CalendarDays className="h-3.5 w-3.5" />
            8:30 PM class
          </Badge>
          <Button variant="ghost" size="icon-lg" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
          </Button>
          <ThemeSwitcher />
          <Avatar className="h-9 w-9 border">
            <AvatarImage src="/avatars/shadcn.jpg" alt="Student avatar" />
            <AvatarFallback>ST</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
