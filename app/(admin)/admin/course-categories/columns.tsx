'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CourseCategoryActions } from '@/components/admin/course-category-actions';

export type CourseCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

function formatCreatedAt(createdAt: string) {
  if (createdAt === new Date(0).toISOString()) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(createdAt));
}

export function getCourseCategoryColumns(usingFallback: boolean): ColumnDef<CourseCategoryRow>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button variant="ghost" className="h-8 px-2 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'slug',
      header: ({ column }) => (
        <Button variant="ghost" className="h-8 px-2 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Slug
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.getValue('slug')}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>
          {row.getValue('is_active') ? 'Active' : 'Inactive'}
        </Badge>
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button variant="ghost" className="h-8 px-2 data-[state=open]:bg-accent" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatCreatedAt(row.getValue('created_at'))}</span>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => {
        const category = row.original;

        return usingFallback ? (
          <div className="text-right text-sm text-muted-foreground">Migration needed</div>
        ) : (
          <div className="flex justify-end">
            <CourseCategoryActions categoryId={category.id} isActive={category.is_active} />
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}