import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PointsSchemaEntryWithTier } from '@/config/tables/points-schema-entries.config'
import { createSortableHeader } from '@/lib/table-core'
import { SortOrder } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

interface CreatePointsSchemaEntriesColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (entry: PointsSchemaEntryWithTier) => void
  onDelete: (entry: PointsSchemaEntryWithTier) => void
  sortBy?: string
  sortOrder?: SortOrder
  onSort?: (columnId: string) => void
}

export function createPointsSchemaEntriesColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreatePointsSchemaEntriesColumnsOptions): ColumnDef<PointsSchemaEntryWithTier>[] {
  const columns: ColumnDef<PointsSchemaEntryWithTier>[] = [
    // Rank column
    {
      id: 'rank',
      accessorFn: (row) => row.placementTier?.rank ?? 0,
      header: () =>
        createSortableHeader('Rank', 'rank', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const rank = row.original.placementTier?.rank
        return <Badge variant='secondary'>{rank ?? '-'}</Badge>
      },
      size: 100,
    },
    // Tier Name column
    {
      id: 'tierName',
      accessorFn: (row) => row.placementTier?.name ?? 'Unknown',
      header: 'Tier Name',
      cell: ({ row }) => {
        const name = row.original.placementTier?.name ?? 'Unknown'
        return <span className='font-mono font-semibold'>{name}</span>
      },
    },
    // Display Name column
    {
      id: 'displayName',
      accessorFn: (row) => row.placementTier?.displayName ?? '-',
      header: 'Display Name',
      cell: ({ row }) => {
        const displayName = row.original.placementTier?.displayName ?? '-'
        return <span>{displayName}</span>
      },
      meta: {
        className: 'hidden md:table-cell',
      },
    },
    // Points column
    {
      accessorKey: 'points',
      id: 'points',
      header: () =>
        createSortableHeader('Points', 'points', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        return (
          <Badge variant='outline' className='font-semibold text-base'>
            {row.original.points}
          </Badge>
        )
      },
      size: 120,
    },
  ]

  // Actions column
  if (canEdit || canDelete) {
    columns.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const entry = row.original
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
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit Points
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(entry)}
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
