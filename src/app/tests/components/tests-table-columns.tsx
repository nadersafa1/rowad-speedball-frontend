import { ColumnDef } from '@tanstack/react-table'
import { Test } from '@/types'
import { TestsTableActions } from './tests-table-actions'
import { createBaseColumns } from './tests-table-base-columns'

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (test: Test) => void,
  onDelete: (test: Test) => void,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  isSystemAdmin?: boolean
): ColumnDef<Test>[] => {
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
          <TestsTableActions
            test={row.original}
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

