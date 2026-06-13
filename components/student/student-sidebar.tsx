'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Plus,
  BookOpen,
  FileText,
  ShoppingCart,
  Clock,
  Zap,
  CheckSquare,
  BarChart3,
  CreditCard,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function StudentSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      title: 'Add Courses',
      href: '/dashboard/add-courses',
      icon: <Plus className="w-5 h-5" />,
    },
    {
      title: 'Courses',
      href: '/dashboard/courses',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      title: 'Contents',
      href: '/dashboard/contents',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      title: 'Orders',
      href: '/dashboard/orders',
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      title: 'Past Exams',
      href: '/dashboard/past-exams',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: 'Practice Exams',
      href: '/dashboard/practice-exams',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      title: 'Solve Sheets',
      href: '/dashboard/solve-sheets',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      title: 'Performance',
      href: '/dashboard/performance',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      title: 'Payments',
      href: '/dashboard/payments',
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      title: 'My Account',
      href: '/dashboard/account',
      icon: <User className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-primary text-white"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl transition-all duration-300 z-40',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            ProfessorLMS
          </h1>
          <p className="text-xs text-slate-400 mt-1">Student Portal</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-140px)]">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700/50'
              )}
            >
              <span
                className={cn(
                  'transition-colors',
                  isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                )}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.title}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-900/50">
          <p className="text-xs text-slate-400 text-center">
            © 2026 ProfessorLMS
          </p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
