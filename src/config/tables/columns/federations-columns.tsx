'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { FederationsSortBy } from '@/config/tables/federations.config'
import type { Federation } from '@/db/schema'
import { createSortableHeader } from '@/lib/table-core'
import { formatDate } from '@/lib/utils'
import { SortOrder } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'

interface CreateColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (federation: Federation) => void
  onDelete: (federation: Federation) => void
  sortBy?: FederationsSortBy
  sortOrder?: SortOrder
  onSort?: (columnId: string) => void
}

export const createFederationsColumns = ({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreateColumnsOptions): ColumnDef<Federation>[] => {
  const columns: ColumnDef<Federation>[] = [
    // Name column
    {
      id: 'name',
      accessorKey: 'name',
      header: () =>
        createSortableHeader('Name', 'name', sortBy, sortOrder, onSort),
      cell: ({ row }) => (
        <div className='font-medium'>{row.getValue('name')}</div>
      ),
    },
    // Description column
    {
      id: 'description',
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null
        return (
          <div className='max-w-[300px] truncate text-sm text-muted-foreground'>
            {description || <span className='text-muted-foreground'>—</span>}
          </div>
        )
      },
    },
    // Created At column (hidden by default)
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: () =>
        createSortableHeader(
          'Created At',
          'createdAt',
          sortBy,
          sortOrder,
          onSort
        ),

      cell: ({ row }) => <div>{formatDate(row.getValue('createdAt'))}</div>,
    },
    // Updated At column (hidden by default)
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: () =>
        createSortableHeader(
          'Updated At',
          'updatedAt',
          sortBy,
          sortOrder,
          onSort
        ),
      cell: ({ row }) => <div>{formatDate(row.getValue('updatedAt'))}</div>,
    },
  ]

  // Add actions column if user has permissions
  if (canEdit || canDelete) {
    columns.push({
      id: 'actions',
      enableHiding: false,
      header: () => <div className='text-right'>Actions</div>,
      cell: ({ row }) => {
        const federation = row.original

        return (
          <div className='text-right'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' className='h-8 w-8 p-0'>
                  <span className='sr-only'>Open menu</span>
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {canEdit && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(federation)
                    }}
                  >
                    <Edit className='mr-2 h-4 w-4' />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    {canEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive focus:bg-destructive/10'
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(federation)
                      }}
                    >
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    })
  }

  return columns
}
