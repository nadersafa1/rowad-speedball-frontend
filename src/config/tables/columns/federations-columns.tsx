'use client'

import { ColumnDef } from '@tanstack/react-table'
import type { Federation } from '@/db/schema'
import { MoreHorizontal, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'
import { SortOrder } from '@/types'
import type { FederationsSortBy } from '@/config/tables/federations.config'

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
      header: () => {
        const isSorted = sortBy === 'name'
        const isAsc = isSorted && sortOrder === SortOrder.ASC

        return (
          <Button
            variant='ghost'
            onClick={() => onSort?.('name')}
            className='-ml-3 h-8 data-[state=open]:bg-accent'
          >
            Name
            {isSorted ? (
              isAsc ? (
                <ArrowUp className='ml-2 h-4 w-4' />
              ) : (
                <ArrowDown className='ml-2 h-4 w-4' />
              )
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
            )}
          </Button>
        )
      },
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
      header: () => {
        const isSorted = sortBy === 'createdAt'
        const isAsc = isSorted && sortOrder === SortOrder.ASC

        return (
          <Button
            variant='ghost'
            onClick={() => onSort?.('createdAt')}
            className='-ml-3 h-8 data-[state=open]:bg-accent'
          >
            Created
            {isSorted ? (
              isAsc ? (
                <ArrowUp className='ml-2 h-4 w-4' />
              ) : (
                <ArrowDown className='ml-2 h-4 w-4' />
              )
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>{formatDate(row.getValue('createdAt'))}</div>
      ),
    },
    // Updated At column (hidden by default)
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: () => {
        const isSorted = sortBy === 'updatedAt'
        const isAsc = isSorted && sortOrder === SortOrder.ASC

        return (
          <Button
            variant='ghost'
            onClick={() => onSort?.('updatedAt')}
            className='-ml-3 h-8 data-[state=open]:bg-accent'
          >
            Updated
            {isSorted ? (
              isAsc ? (
                <ArrowUp className='ml-2 h-4 w-4' />
              ) : (
                <ArrowDown className='ml-2 h-4 w-4' />
              )
            ) : (
              <ArrowUpDown className='ml-2 h-4 w-4 opacity-50' />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>{formatDate(row.getValue('updatedAt'))}</div>
      ),
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
