import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createSortableHeader, createDateColumn } from '@/lib/table-core'
import { SortOrder } from '@/types'
import type { PointsSchema } from '@/db/schema'
import { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface CreatePointsSchemasColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (schema: PointsSchema) => void
  onDelete: (schema: PointsSchema) => void
  sortBy?: string
  sortOrder?: SortOrder
  onSort?: (columnId: string) => void
}

export function createPointsSchemasColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreatePointsSchemasColumnsOptions): ColumnDef<PointsSchema>[] {
  const columns: ColumnDef<PointsSchema>[] = [
    // Name column (with navigation)
    {
      accessorKey: 'name',
      id: 'name',
      header: () =>
        createSortableHeader('Name', 'name', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const schema = row.original
        return (
          <Link
            href={`/admin/points-schemas/${schema.id}`}
            className='flex items-center gap-2 font-semibold hover:text-rowad-600 transition-colors'
          >
            {schema.name}
            <ExternalLink className='h-3 w-3' />
          </Link>
        )
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
      ...createDateColumn<PointsSchema>(
        'createdAt',
        'Created At',
        (row) => row.createdAt,
        {
          sortable: true,
          sortBy,
          sortOrder,
          onSort,
        }
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
        const schema = row.original
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
              <DropdownMenuItem asChild>
                <Link href={`/admin/points-schemas/${schema.id}`}>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  View Entries
                </Link>
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(schema)}>
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit Schema
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(schema)}
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
