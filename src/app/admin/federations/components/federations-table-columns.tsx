import { ColumnDef } from '@tanstack/react-table'
import type { Federation } from '@/db/schema'
import { FederationsTableActions } from './federations-table-actions'
import { createBaseColumns } from './federations-table-base-columns'
import { createHiddenColumns } from './federations-table-hidden-columns'

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (federation: Federation) => void,
  onDelete: (federation: Federation) => void,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  onRefetch?: () => void
): ColumnDef<Federation>[] => {
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
          <FederationsTableActions
            federation={row.original}
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

