'use client';

import { useState } from 'react';

import { ColumnDef, Row } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { DataTable } from './data-table';

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

function CategoryActionsCell({ row, usingFallback }: { row: Row<CourseCategoryRow>; usingFallback: boolean }) {
  const category = row.original;
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    if (usingFallback) return;

    setBusy(true);

    try {
      await fetch(`/api/course-categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.is_active }),
      });

      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return usingFallback ? (
    <div className="text-right text-sm text-muted-foreground">Migration needed</div>
  ) : (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Open category actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(category.id)}>
            Copy category ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(category.slug)}>
            Copy slug
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={busy} onClick={toggleActive}>
            {category.is_active ? 'Deactivate' : 'Activate'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function getCourseCategoryColumns(usingFallback: boolean): ColumnDef<CourseCategoryRow>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-8 px-2 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'slug',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="h-8 px-2 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
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
        <Button
          variant="ghost"
          className="h-8 px-2 data-[state=open]:bg-accent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatCreatedAt(row.getValue('created_at'))}</span>,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: ({ row }) => <CategoryActionsCell row={row} usingFallback={usingFallback} />,
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

export function CourseCategoryTable({
  data,
  usingFallback,
}: {
  data: CourseCategoryRow[];
  usingFallback: boolean;
}) {
  return <DataTable columns={getCourseCategoryColumns(usingFallback)} data={data} />;
}