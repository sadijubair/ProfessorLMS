'use client';

import { BookOpen } from 'lucide-react';

export function SidebarBranding() {
  const version = '1.0.0';

  return (
    <div className="px-4 py-3 border-b border-sidebar-border flex items-center justify-center group-data-[state=collapsed]:px-2">
      <div className="flex items-center gap-3 w-full group-data-[state=collapsed]:w-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary flex-shrink-0">
          <BookOpen className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-1 flex-col min-w-0 group-data-[state=collapsed]:hidden">
          <span className="text-sm font-semibold text-sidebar-foreground truncate">ProfessorLMS</span>
          <span className="text-xs text-sidebar-foreground/60">v{version}</span>
        </div>
      </div>
    </div>
  );
}
