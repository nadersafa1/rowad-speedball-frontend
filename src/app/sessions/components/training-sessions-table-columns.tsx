import { ColumnDef } from '@tanstack/react-table'
import { TrainingSession, Coach } from '@/db/schema'
import { TrainingSessionsTableActions } from './training-sessions-table-actions'
import { createBaseColumns } from './training-sessions-table-base-columns'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (session: TrainingSessionWithCoaches) => void,
  onDelete: (session: TrainingSessionWithCoaches) => void,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  isSystemAdmin?: boolean
): ColumnDef<TrainingSessionWithCoaches>[] => {
  const baseColumns = createBaseColumns(sortBy, sortOrder, onSort, isSystemAdmin)

  // Only add actions column if user can edit or delete
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
          <TrainingSessionsTableActions
            session={row.original}
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

