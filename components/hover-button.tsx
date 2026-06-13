'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface HoverButtonProps {
  children: string;
  href: string;
  variant?: 'primary' | 'outline';
}

export default function HoverButton({ children, href, variant = 'primary' }: HoverButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'outline') {
    return (
      <Button
        asChild
        className="flex-1 border-2 border-blue-500 text-blue-500 dark:text-blue-400 dark:border-blue-400 font-semibold h-10 text-sm transition-all rounded-lg"
        style={{
          backgroundColor: isHovered ? '#6A5ACD' : 'transparent',
          color: isHovered ? 'white' : '#3B82F6',
          borderColor: isHovered ? '#6A5ACD' : '#3B82F6',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={href}>{children}</Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      className="flex-1 text-white font-semibold h-10 text-sm transition-all rounded-lg"
      style={{
        backgroundColor: isHovered ? '#6A5ACD' : '#3B82F6',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
