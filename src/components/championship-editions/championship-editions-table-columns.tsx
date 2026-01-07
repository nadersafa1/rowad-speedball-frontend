import { ColumnDef } from '@tanstack/react-table'
import { createBaseColumns } from './championship-editions-table-base-columns'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (edition: ChampionshipEditionWithRelations) => void,
  onDelete: (id: string) => void,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  onRefetch?: () => void,
  championshipId?: string
): ColumnDef<ChampionshipEditionWithRelations>[] => {
  const baseColumns = createBaseColumns(sortBy, sortOrder, onSort)

  // If no actions available and no championshipId, just return base columns
  if (!canEdit && !canDelete && !championshipId) {
    return baseColumns
  }

  const actionsColumn: ColumnDef<ChampionshipEditionWithRelations> = {
    id: 'actions',
    cell: ({ row }) => {
      const edition = row.original
      const ActionsCell = () => {
        const router = useRouter()

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
                onClick={() => router.push(`/championships/${championshipId}/edition/${edition.id}`)}
              >
                View Events
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(edition)}>
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(edition.id)}
                  className='text-destructive focus:text-destructive'
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }

      return <ActionsCell />
    },
  }

  return [...baseColumns, actionsColumn]
}
