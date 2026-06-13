'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { type Icon } from '@tabler/icons-react';

import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function StudentNavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + '/');
  };

  return (
    <SidebarGroup className="px-3 py-2">
      <SidebarGroupLabel className="px-2 text-[0.7rem] font-semibold uppercase text-sidebar-foreground/50">
        Learn
      </SidebarGroupLabel>
      <SidebarGroupContent className="mt-1 flex flex-col gap-1">
        <SidebarMenu className="gap-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive(item.url)} 
                tooltip={item.title}
                className={cn(
                  'h-10 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
                  isActive(item.url) &&
                    'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                )}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
