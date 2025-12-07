import { ColumnDef } from '@tanstack/react-table'
import type { Federation } from '@/db/schema'
import { SortableHeader } from './federations-table-sortable-header'
import { NameCell, DescriptionCell } from './federations-table-cell-renderers'

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<Federation>[] => [
  {
    accessorKey: 'name',
    id: 'name',
    enableHiding: false,
    header: () => (
      <SortableHeader
        label='Name'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='name'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <NameCell name={row.getValue('name')} />,
  },
  {
    accessorKey: 'description',
    id: 'description',
    enableHiding: false,
    header: 'Description',
    cell: ({ row }) => (
      <DescriptionCell description={row.getValue('description')} />
    ),
  },
]

