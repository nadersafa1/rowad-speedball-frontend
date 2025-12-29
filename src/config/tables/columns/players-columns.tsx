/**
 * Players Table Columns
 * Column definitions using table-core helpers
 */

import { ColumnDef } from '@tanstack/react-table'
import { Player } from '@/types'
import {
  createSortableHeader,
  createTextColumn,
  createBadgeColumn,
  createSelectionColumn,
} from '@/lib/table-core'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2, BadgeCheck } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CreateColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
  enableSelection?: boolean
}

export function createPlayersColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
  enableSelection = false,
}: CreateColumnsOptions): ColumnDef<Player>[] {
  const baseColumns: ColumnDef<Player>[] = []

  // Add selection column if enabled
  if (enableSelection) {
    baseColumns.push(createSelectionColumn<Player>())
  }

  // Add data columns
  baseColumns.push(
    // Name column - custom cell with link and user badge
    {
      accessorKey: 'name',
      id: 'name',
      header: () =>
        createSortableHeader('Name', 'name', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const player = row.original
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{player.name}</span>
            {player.userId && (
              <BadgeCheck className="h-4 w-4 text-blue-500" />
            )}
          </div>
        )
      },
    },

    // Gender column - custom badge with variant
    {
      accessorKey: 'gender',
      id: 'gender',
      header: () =>
        createSortableHeader('Gender', 'gender', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const gender = row.getValue('gender') as string
        return (
          <Badge variant={gender === 'male' ? 'default' : 'secondary'}>
            {gender === 'male' ? '👨' : '👩'}{' '}
            {gender.charAt(0).toUpperCase() + gender.slice(1)}
          </Badge>
        )
      },
    },

    // Age Group column
    {
      accessorKey: 'ageGroup',
      id: 'ageGroup',
      header: () =>
        createSortableHeader('Age Group', 'ageGroup', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const ageGroup = row.getValue('ageGroup') as string
        return <div className="font-medium text-speedball-600">{ageGroup}</div>
      },
    },

    // Preferred Hand column
    createTextColumn<Player>(
      'preferredHand',
      'Preferred Hand',
      (row) => row.preferredHand,
      {
        sortable: true,
        sortBy,
        sortOrder,
        onSort,
        className: 'capitalize',
      }
    ),

    // Club/Organization column
    {
      accessorKey: 'organizationName',
      id: 'organizationId',
      enableHiding: false,
      header: () =>
        createSortableHeader('Club', 'organizationId', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const orgName = row.original.organizationName
        return <div className="text-sm">{orgName || '—'}</div>
      },
    },

    // Hidden columns that can be toggled

    // RTL Name
    {
      accessorKey: 'nameRtl',
      id: 'nameRtl',
      enableHiding: true,
      header: () =>
        createSortableHeader('RTL Name', 'nameRtl', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const nameRtl = row.getValue('nameRtl') as string | null
        return (
          <div dir="rtl" className="text-right">
            {nameRtl || '—'}
          </div>
        )
      },
    },

    // Age
    {
      accessorKey: 'age',
      id: 'age',
      enableHiding: true,
      header: () =>
        createSortableHeader('Age', 'age', sortBy, sortOrder, () => onSort?.('age')),
      cell: ({ row }) => {
        const age = row.getValue('age') as number
        return <div>{age}</div>
      },
    },

    // Date of Birth
    {
      accessorKey: 'dateOfBirth',
      id: 'dateOfBirth',
      enableHiding: true,
      header: () =>
        createSortableHeader('Date of Birth', 'dateOfBirth', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const dob = row.getValue('dateOfBirth') as string
        return <div>{new Date(dob).toLocaleDateString()}</div>
      },
    },

    // Created At
    {
      accessorKey: 'createdAt',
      id: 'createdAt',
      enableHiding: true,
      header: () =>
        createSortableHeader('Created', 'createdAt', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const created = row.getValue('createdAt') as string
        return <div>{new Date(created).toLocaleDateString()}</div>
      },
    }
  )

  // Add actions column if user has edit or delete permissions
  if (canEdit || canDelete) {
    baseColumns.push({
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const player = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(player)
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(player)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
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
