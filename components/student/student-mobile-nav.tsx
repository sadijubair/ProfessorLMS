'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ClipboardList, CreditCard, Home, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function StudentMobileNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
      label: 'Home',
    },
    {
      href: '/dashboard/courses',
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Courses',
    },
    {
      href: '/dashboard/practice',
      icon: <ClipboardList className="h-5 w-5" />,
      label: 'Practice',
    },
    {
      href: '/dashboard/leaderboards',
      icon: <Trophy className="h-5 w-5" />,
      label: 'Ranks',
    },
    {
      href: '/dashboard/payments',
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Pay',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 md:hidden">
      <div className="grid h-16 grid-cols-5 items-center rounded-lg border bg-background/95 shadow-lg shadow-black/10 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[0.7rem] font-medium transition-colors',
              isActive(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div
              className={cn(
                'flex h-7 w-9 items-center justify-center rounded-full transition-colors',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.icon}
            </div>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
