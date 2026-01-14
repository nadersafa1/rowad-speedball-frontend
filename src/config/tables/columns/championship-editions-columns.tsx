/**
 * Championship Editions Table Columns
 * Column definitions using table-core helpers
 */

import { ColumnDef } from '@tanstack/react-table'
import { createSortableHeader } from '@/lib/table-core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { ChampionshipEditionWithRelations } from '@/components/championship-editions/championship-editions-table-types'

interface CreateColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (edition: ChampionshipEditionWithRelations) => void
  onDelete: (editionId: string) => void
  onViewEvents: (championshipId: string, editionId: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
  championshipId: string
}

export function createChampionshipEditionsColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onViewEvents,
  sortBy,
  sortOrder,
  onSort,
  championshipId,
}: CreateColumnsOptions): ColumnDef<ChampionshipEditionWithRelations>[] {
  const baseColumns: ColumnDef<ChampionshipEditionWithRelations>[] = [
    // Status column
    {
      accessorKey: 'status',
      id: 'status',
      header: () =>
        createSortableHeader('Status', 'status', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge
            variant={
              status === 'published'
                ? 'default'
                : status === 'draft'
                ? 'secondary'
                : 'outline'
            }
          >
            {status}
          </Badge>
        )
      },
    },

    // Registration Period column
    {
      id: 'registrationDates',
      header: () => <div>Registration Period</div>,
      cell: ({ row }) => {
        const startDate = row.original.registrationStartDate
        const endDate = row.original.registrationEndDate

        if (!startDate || !endDate) {
          return <span className='text-sm text-muted-foreground'>Not set</span>
        }

        return (
          <div className='text-sm'>
            <div>{format(new Date(startDate), 'MMM dd, yyyy')}</div>
            <div className='text-muted-foreground'>
              to {format(new Date(endDate), 'MMM dd, yyyy')}
            </div>
          </div>
        )
      },
    },
  ]

  // Add actions column if user has any permissions
  if (canEdit || canDelete || championshipId) {
    baseColumns.push({
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const edition = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onViewEvents(championshipId, edition.id)
                }}
              >
                <Eye className='mr-2 h-4 w-4' />
                View Events
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(edition)
                  }}
                >
                  <Pencil className='mr-2 h-4 w-4' />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(edition.id)
                  }}
                  className='text-destructive focus:text-destructive'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })
  }

  return baseColumns
}
