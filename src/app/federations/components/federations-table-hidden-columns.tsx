import { ColumnDef } from '@tanstack/react-table'
import type { Federation } from '@/db/schema'
import { SortableHeader } from './federations-table-sortable-header'
import { DateCell } from './federations-table-cell-renderers'

export const createHiddenColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<Federation>[] => [
  {
    accessorKey: 'createdAt',
    id: 'createdAt',
    header: () => (
      <SortableHeader
        label='Created'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='createdAt'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <DateCell date={row.getValue('createdAt')} />,
    enableHiding: true,
  },
  {
    accessorKey: 'updatedAt',
    id: 'updatedAt',
    header: () => (
      <SortableHeader
        label='Updated'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='updatedAt'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <DateCell date={row.getValue('updatedAt')} />,
    enableHiding: true,
  },
]

