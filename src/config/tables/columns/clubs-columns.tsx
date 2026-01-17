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
import { createSortableHeader } from '@/lib/table-core'
import { formatDate } from '@/lib/utils'
import { SortOrder } from '@/types'
import { ColumnDef } from '@tanstack/react-table'
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
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
      header: () =>
        createSortableHeader('Name', 'name', sortBy, sortOrder, onSort),
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
      header: () =>
        createSortableHeader('Slug', 'slug', sortBy, sortOrder, onSort),
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
