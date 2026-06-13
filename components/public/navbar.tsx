'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Menu, X, Search, User, Moon, Sun, LogIn } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

export default function Navbar({
  isStudentLoggedIn = false,
}: {
  isStudentLoggedIn?: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolling(true);

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Calculate scroll indicator position
  const documentHeight = typeof document !== 'undefined' ? document.documentElement.scrollHeight - window.innerHeight : 0;
  const scrollPercentage = documentHeight > 0 ? (scrollY / documentHeight) * 100 : 0;

  return (
    <nav className="sticky top-0 z-50">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/10 dark:bg-slate-950/40 backdrop-blur-md border-b border-white/20 dark:border-slate-800/50"></div>

      {/* Scroll Indicator Dots */}
      {isScrolling && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 opacity-70"
          style={{
            width: `${scrollPercentage}%`,
            transition: 'width 0.1s ease-out'
          }}
        ></div>
      )}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logos.png"
              alt="ProfessorLMS Logo"
              width={120}
              height={40}
              priority
            />
          </Link>

          {/* Desktop Center Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Home', href: '/' },
              { label: 'Courses', href: '/courses' },
              { label: 'Features', href: '#features' },
              { label: 'About', href: '#about' },
            ].map((item, index) => {
              const isActive = pathname === item.href;
              return (
              <Link
                  key={index}
                  href={item.href}
                  className={`text-sm font-medium transition-all relative group px-4 py-2 rounded-full ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-700 dark:text-slate-200 hover:text-blue-500 dark:hover:text-blue-400'
                  }`}
                  style={isActive ? { backgroundColor: '#00416A' } : {}}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800/50 transition-colors group">
              <Search className="w-5 h-5 text-slate-600 dark:text-slate-100 group-hover:text-blue-500 transition-colors" />
            </button>

            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800/50 transition-colors group"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-100 group-hover:text-yellow-400 transition-colors" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-100 group-hover:text-blue-400 transition-colors" />
              )}
            </button>
            
            <Link
              href={isStudentLoggedIn ? '/dashboard/account' : '/login'}
              className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800/50 transition-colors group"
              aria-label={isStudentLoggedIn ? 'Account' : 'Login'}
            >
              <User className="w-5 h-5 text-slate-600 dark:text-slate-100 group-hover:text-blue-500 transition-colors" />
            </Link>
            
            <Button asChild className="bg-blue-500 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 hover:shadow-lg rounded-full px-4 py-2 text-sm font-medium transition-all inline-flex items-center justify-center gap-2 h-[2.625rem]">
              <Link href={isStudentLoggedIn ? '/dashboard' : '/login'}>
                {isStudentLoggedIn ? (
                  <LayoutDashboard className="w-4 h-4" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {isStudentLoggedIn ? 'Dashboard' : 'Login'}
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800/50 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-slate-900 dark:text-slate-100" />
            ) : (
              <Menu className="w-6 h-6 text-slate-900 dark:text-slate-100" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 dark:border-slate-800/50 py-4 space-y-3 pb-4">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="mx-4 flex items-center gap-2 rounded-lg px-4 py-2 text-slate-900 transition-colors hover:bg-white/20 dark:text-slate-100 dark:hover:bg-slate-800/50"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-100" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-100" />
              )}
              <span className="text-sm font-medium">{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
            <Link
              href="/"
              className="block px-4 py-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/courses"
              className="block px-4 py-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Courses
            </Link>
            <Link
              href={isStudentLoggedIn ? '/dashboard' : '/login'}
              className="block px-4 py-2 rounded-lg hover:bg-white/20 dark:hover:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {isStudentLoggedIn ? 'Dashboard' : 'Login'}
            </Link>
            {!isStudentLoggedIn ? (
              <Button asChild className="w-full bg-blue-500 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500 hover:shadow-lg rounded-full py-2 text-sm font-medium transition-all inline-flex items-center justify-center gap-2 h-[2.625rem]">
                <Link href="/signup">
                  <LogIn className="w-4 h-4" />
                  Sign Up
                </Link>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
}
