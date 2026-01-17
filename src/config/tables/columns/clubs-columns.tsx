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
import type { ClubsSortBy, ClubWithCount } from '@/config/tables/clubs.config'
import { formatDate } from '@/lib/utils'
import { SortOrder } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'

interface CreateColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (club: ClubWithCount) => void
  onDelete: (club: ClubWithCount) => void
  sortBy?: ClubsSortBy
  sortOrder?: SortOrder
  onSort?: (columnId: string) => void
}

export const createClubsColumns = ({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreateColumnsOptions): ColumnDef<ClubWithCount>[] => {
  const columns: ColumnDef<ClubWithCount>[] = [
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
      cell: ({ row }) => {
        const organization = row.original
        return (
          <Link
            href={`/admin/clubs/${organization.id}`}
            className='font-medium hover:underline'
          >
            {organization.name}
          </Link>
        )
      },
    },
    // Slug column
    {
      id: 'slug',
      accessorKey: 'slug',
      header: () => {
        const isSorted = sortBy === 'slug'
        const isAsc = isSorted && sortOrder === SortOrder.ASC

        return (
          <Button
            variant='ghost'
            onClick={() => onSort?.('slug')}
            className='-ml-3 h-8 data-[state=open]:bg-accent'
          >
            Slug
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
        <code className='text-sm bg-muted px-2 py-1 rounded'>
          {row.getValue('slug')}
        </code>
      ),
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
      cell: ({ row }) => <div>{formatDate(row.getValue('createdAt'))}</div>,
    },
  ]

  // Add actions column if user has permissions
  if (canEdit || canDelete) {
    columns.push({
      id: 'actions',
      enableHiding: false,
      header: () => <div className='text-right'>Actions</div>,
      cell: ({ row }) => {
        const club = row.original

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
                      onEdit(club)
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
                        onDelete(club)
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
