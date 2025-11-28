import { ColumnDef } from '@tanstack/react-table'
import { Coach } from '@/db/schema'
import { CoachesTableActions } from './coaches-table-actions'
import { createBaseColumns } from './coaches-table-base-columns'
import { createHiddenColumns } from './coaches-table-hidden-columns'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (coach: Coach) => void,
  onDelete: (coach: Coach) => void,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<CoachWithOrg>[] => {
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
          <CoachesTableActions
            coach={row.original}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  ]
}

