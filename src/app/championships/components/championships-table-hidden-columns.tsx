import { ColumnDef } from '@tanstack/react-table'
import { SortableHeader } from './championships-table-sortable-header'
import { DateCell } from './championships-table-cell-renderers'
import { ChampionshipWithFederation } from './championships-table-types'

export const createHiddenColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<ChampionshipWithFederation>[] => [
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
