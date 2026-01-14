import { ColumnDef } from '@tanstack/react-table'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'
import {
  YearCell,
  StatusCell,
  RegistrationDatesCell,
} from './championship-editions-table-cell-renderers'

interface SortableHeaderProps {
  label: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  field: string
  onSort?: (field: string) => void
}

const SortableHeader = ({
  label,
  sortBy,
  sortOrder,
  field,
  onSort,
}: SortableHeaderProps) => {
  const isSorted = sortBy === field
  return (
    <div
      className='flex items-center gap-1 cursor-pointer select-none'
      onClick={() => onSort?.(field)}
    >
      <span>{label}</span>
      {isSorted && (
        <span className='text-xs'>{sortOrder === 'asc' ? '↑' : '↓'}</span>
      )}
    </div>
  )
}

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<ChampionshipEditionWithRelations>[] => [
  {
    accessorKey: 'year',
    id: 'year',
    enableHiding: false,
    header: () => (
      <SortableHeader
        label='Year'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='year'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <YearCell year={row.getValue('year')} />,
  },
  {
    accessorKey: 'status',
    id: 'status',
    header: () => (
      <SortableHeader
        label='Status'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='status'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <StatusCell status={row.getValue('status')} />,
  },
  {
    accessorKey: 'registrationStartDate',
    id: 'registrationDates',
    header: () => <div>Registration Period</div>,
    cell: ({ row }) => (
      <RegistrationDatesCell
        startDate={row.original.registrationStartDate}
        endDate={row.original.registrationEndDate}
      />
    ),
  },
  {
    accessorKey: 'championshipName',
    id: 'championshipName',
    header: () => <div>Championship</div>,
    cell: ({ row }) => (
      <span className='text-sm'>{row.getValue('championshipName') || '—'}</span>
    ),
  },
  {
    accessorKey: 'federationName',
    id: 'federationName',
    header: () => <div>Federation</div>,
    cell: ({ row }) => (
      <span className='text-sm text-muted-foreground'>
        {row.getValue('federationName') || '—'}
      </span>
    ),
  },
]
