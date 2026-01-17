import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { createSortableHeader, createDateColumn } from '@/lib/table-core'
import { SortOrder } from '@/types'
import type { PlacementTier } from '@/db/schema'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

interface CreatePlacementTiersColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (tier: PlacementTier) => void
  onDelete: (tier: PlacementTier) => void
  sortBy?: string
  sortOrder?: SortOrder
  onSort?: (columnId: string) => void
}

export function createPlacementTiersColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreatePlacementTiersColumnsOptions): ColumnDef<PlacementTier>[] {
  const columns: ColumnDef<PlacementTier>[] = [
    // Rank column
    {
      accessorKey: 'rank',
      id: 'rank',
      header: () =>
        createSortableHeader('Rank', 'rank', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        return <Badge variant='secondary'>{row.original.rank}</Badge>
      },
      size: 100,
    },
    // Name column
    {
      accessorKey: 'name',
      id: 'name',
      header: () =>
        createSortableHeader('Name', 'name', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        return (
          <span className='font-mono font-semibold'>{row.original.name}</span>
        )
      },
    },
    // Display Name column
    {
      accessorKey: 'displayName',
      id: 'displayName',
      header: 'Display Name',
      cell: ({ row }) => {
        return <span>{row.original.displayName || '-'}</span>
      },
    },
    // Description column
    {
      accessorKey: 'description',
      id: 'description',
      header: 'Description',
      cell: ({ row }) => {
        return (
          <span className='max-w-xs truncate'>
            {row.original.description || '-'}
          </span>
        )
      },
      meta: {
        className: 'hidden md:table-cell',
      },
    },
    // Created At column
    {
      ...createDateColumn<PlacementTier>(
        'createdAt',
        'Created At',
        (row) => row.createdAt
      ),
      meta: {
        className: 'hidden lg:table-cell',
      },
    },
  ]

  // Actions column
  if (canEdit || canDelete) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const tier = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreHorizontal className='h-4 w-4' />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(tier)}>
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(tier)}
                  className='text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      size: 70,
    })
  }

  return columns
}
