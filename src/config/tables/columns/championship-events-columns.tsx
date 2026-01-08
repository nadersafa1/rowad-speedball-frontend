/**
 * Championship Events Table Columns
 * Column definitions for events within a championship edition
 */

import { ColumnDef } from '@tanstack/react-table'
import { Event } from '@/types'
import { createSortableHeader } from '@/lib/table-core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { EVENT_TYPE_LABELS } from '@/types/event-types'
import { EVENT_FORMAT_LABELS } from '@/types/event-format'

interface EventWithPointsSchema extends Event {
  pointsSchemaName?: string | null
}

interface CreateColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (event: EventWithPointsSchema) => void
  onDelete: (eventId: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
}

export function createChampionshipEventsColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreateColumnsOptions): ColumnDef<EventWithPointsSchema>[] {
  const baseColumns: ColumnDef<EventWithPointsSchema>[] = [
    // Event Name column
    {
      accessorKey: 'name',
      id: 'name',
      enableHiding: false,
      header: () => <div>Event Name</div>,
      cell: ({ row }) => {
        const name = row.getValue('name') as string
        return <div className='font-medium'>{name}</div>
      },
    },

    // Type column
    {
      accessorKey: 'eventType',
      id: 'eventType',
      header: () => <div>Type</div>,
      cell: ({ row }) => {
        const eventType = row.getValue(
          'eventType'
        ) as keyof typeof EVENT_TYPE_LABELS
        return <div>{EVENT_TYPE_LABELS[eventType] || eventType}</div>
      },
    },

    // Gender column
    {
      accessorKey: 'gender',
      id: 'gender',
      header: () => <div>Gender</div>,
      cell: ({ row }) => {
        const gender = row.getValue('gender') as string
        return <div className='capitalize'>{gender}</div>
      },
    },

    // Format column
    {
      accessorKey: 'format',
      id: 'format',
      header: () => <div>Format</div>,
      cell: ({ row }) => {
        const format = row.getValue(
          'format'
        ) as keyof typeof EVENT_FORMAT_LABELS
        return <div>{EVENT_FORMAT_LABELS[format] || format}</div>
      },
    },

    // Points Schema column
    {
      id: 'pointsSchema',
      header: () => <div>Points Schema</div>,
      cell: ({ row }) => {
        const pointsSchemaName = row.original.pointsSchemaName
        return (
          <div className='text-sm text-muted-foreground'>
            {pointsSchemaName || 'Not assigned'}
          </div>
        )
      },
    },

    // Registration Period column
    {
      id: 'registration',
      header: () => <div>Registration</div>,
      cell: ({ row }) => {
        const startDate = row.original.registrationStartDate
        const endDate = row.original.registrationEndDate

        if (!startDate || !endDate) {
          return <span className='text-sm text-muted-foreground'>Not set</span>
        }

        return (
          <div className='text-sm'>
            {format(new Date(startDate), 'MMM dd')} -{' '}
            {format(new Date(endDate), 'MMM dd, yyyy')}
          </div>
        )
      },
    },

    // Status column
    {
      accessorKey: 'completed',
      id: 'completed',
      header: () => <div>Status</div>,
      cell: ({ row }) => {
        const completed = row.getValue('completed') as boolean
        return (
          <Badge variant={completed ? 'default' : 'secondary'}>
            {completed ? 'Completed' : 'Ongoing'}
          </Badge>
        )
      },
    },
  ]

  // Add actions column if user has edit or delete permissions
  if (canEdit || canDelete) {
    baseColumns.push({
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const event = row.original

        return (
          <div className='flex items-center gap-2'>
            {canEdit && (
              <Button
                variant='ghost'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(event)
                }}
              >
                <Pencil className='h-4 w-4' />
              </Button>
            )}
            {canDelete && (
              <Button
                variant='ghost'
                size='sm'
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(event.id)
                }}
              >
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            )}
          </div>
        )
      },
    })
  }

  return baseColumns
}
