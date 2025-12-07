import { ColumnDef } from '@tanstack/react-table'
import { ChampionshipsTableActions } from './championships-table-actions'
import { createBaseColumns } from './championships-table-base-columns'
import { createHiddenColumns } from './championships-table-hidden-columns'
import { ChampionshipWithFederation } from './championships-table-types'

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (championship: ChampionshipWithFederation) => void,
  onDelete: (championship: ChampionshipWithFederation) => void,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  onRefetch?: () => void
): ColumnDef<ChampionshipWithFederation>[] => {
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
          <ChampionshipsTableActions
            championship={row.original}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
            onRefetch={onRefetch}
          />
        </div>
      ),
    },
  ]
}
