import { ColumnDef } from '@tanstack/react-table'
import { Player } from '@/types'
import { PlayersTableActions } from './players-table-actions'
import { createBaseColumns } from './players-table-base-columns'
import { createHiddenColumns } from './players-table-hidden-columns'

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (player: Player) => void,
  onDelete: (player: Player) => void,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  onRefetch?: () => void
): ColumnDef<Player>[] => {
  const baseColumns = [
    ...createBaseColumns(sortBy, sortOrder, onSort),
    ...createHiddenColumns(sortBy, sortOrder, onSort),
  ]

  if (!canEdit && !canDelete) {
    return baseColumns
  }

  return [
    ...baseColumns,
    {
      id: 'actions',
      enableHiding: false,
      header: () => <div className='text-right'>Actions</div>,
      cell: ({ row }) => (
        <div className='text-right'>
          <PlayersTableActions
            player={row.original}
            onEdit={onEdit}
            onDelete={onDelete}
            onRefetch={onRefetch}
          />
        </div>
      ),
    },
  ]
}
