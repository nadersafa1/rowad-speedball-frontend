import { ColumnDef } from '@tanstack/react-table'
import { Coach } from '@/db/schema'
import { SortableHeader } from './coaches-table-sortable-header'
import { DateCell } from './coaches-table-cell-renderers'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

export const createHiddenColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<CoachWithOrg>[] => [
  {
    accessorKey: 'nameRtl',
    id: 'nameRtl',
    header: () => (
      <SortableHeader
        label='RTL Name'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='nameRtl'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div dir='rtl' className='text-right'>
        {row.getValue('nameRtl') || '-'}
      </div>
    ),
    enableHiding: true,
  },
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
]

