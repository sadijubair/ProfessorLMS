'use client';

import * as React from 'react';
import { type Icon } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function StudentNavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props} className={cn('px-3 py-2', props.className)}>
      <SidebarGroupLabel className="px-2 text-[0.7rem] font-semibold uppercase text-sidebar-foreground/50">
        Account
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="mt-1 gap-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
                tooltip={item.title}
                className="h-10 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
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
