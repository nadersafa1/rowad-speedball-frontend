/**
 * Championships Table Columns
 * Column definitions using table-core helpers
 */

import { ColumnDef } from '@tanstack/react-table'
import { Championship } from '@/db/schema'
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

interface ChampionshipWithFederation extends Championship {
  federationName: string | null
}

interface CreateColumnsOptions {
  canEdit: boolean
  canDelete: boolean
  onEdit: (championship: ChampionshipWithFederation) => void
  onDelete: (championshipId: string) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
}

export function createChampionshipsColumns({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  sortBy,
  sortOrder,
  onSort,
}: CreateColumnsOptions): ColumnDef<ChampionshipWithFederation>[] {
  const baseColumns: ColumnDef<ChampionshipWithFederation>[] = [
    // Name column
    {
      accessorKey: 'name',
      id: 'name',
      enableHiding: false,
      header: () =>
        createSortableHeader('Name', 'name', sortBy, sortOrder, onSort),
      cell: ({ row }) => {
        const name = row.getValue('name') as string
        return <div className="font-semibold">{name}</div>
      },
    },

    // Federation column
    {
      accessorKey: 'federationName',
      id: 'federationName',
      enableHiding: false,
      header: () => <div>Federation</div>,
      cell: ({ row }) => {
        const federationName = row.getValue('federationName') as string | null
        return <div className="text-sm">{federationName || '—'}</div>
      },
    },

    // Description column
    {
      accessorKey: 'description',
      id: 'description',
      header: () => <div>Description</div>,
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null
        return (
          <div className="text-sm text-muted-foreground max-w-md truncate">
            {description || '—'}
          </div>
        )
      },
    },

    // Competition Scope column
    {
      accessorKey: 'competitionScope',
      id: 'competitionScope',
      header: () =>
        createSortableHeader(
          'Competition Scope',
          'competitionScope',
          sortBy,
          sortOrder,
          onSort
        ),
      cell: ({ row }) => {
        const scope = row.getValue('competitionScope') as 'clubs' | 'open'
        return (
          <Badge variant={scope === 'clubs' ? 'default' : 'secondary'}>
            {scope === 'clubs' ? 'Clubs' : 'Open'}
          </Badge>
        )
      },
    },
  ]

  // Add actions column if user has any permissions
  if (canEdit || canDelete) {
    baseColumns.push({
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const championship = row.original

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
                    onEdit(championship)
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
                    onDelete(championship.id)
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
