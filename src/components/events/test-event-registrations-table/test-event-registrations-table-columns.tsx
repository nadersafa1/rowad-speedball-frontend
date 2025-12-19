import { ColumnDef } from '@tanstack/react-table'
import { RegistrationTableRow, SortableField } from './test-event-registrations-table-types'
import { SortableHeader } from './test-event-registrations-table-sortable-header'
import { formatPlayers } from '@/lib/utils/player-formatting'

export const createColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<RegistrationTableRow>[] => [
  {
    accessorKey: 'rank',
    id: 'rank',
    header: () => (
      <SortableHeader
        label='Rank'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='rank'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='font-medium'>{row.getValue('rank')}</div>
    ),
  },
  {
    accessorKey: 'playerName',
    id: 'playerName',
    header: () => (
      <SortableHeader
        label='Player'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='playerName'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => {
      const reg = row.original.registration
      const playerName = formatPlayers(reg.players || [], {
        showPositions: false,
      })
      return <div className='font-medium'>{playerName}</div>
    },
  },
  {
    accessorKey: 'heatName',
    id: 'heat',
    header: () => (
      <SortableHeader
        label='Heat'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='heat'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground'>
        {row.original.heatName || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'clubName',
    id: 'club',
    header: () => (
      <SortableHeader
        label='Club'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='club'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='text-muted-foreground'>
        {row.original.clubName || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'positionR',
    id: 'positionR',
    enableHiding: true,
    header: () => (
      <SortableHeader
        label='R'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='positionR'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.getValue('positionR')}</div>
    ),
  },
  {
    accessorKey: 'positionL',
    id: 'positionL',
    enableHiding: true,
    header: () => (
      <SortableHeader
        label='L'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='positionL'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.getValue('positionL')}</div>
    ),
  },
  {
    accessorKey: 'positionF',
    id: 'positionF',
    enableHiding: true,
    header: () => (
      <SortableHeader
        label='F'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='positionF'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.getValue('positionF')}</div>
    ),
  },
  {
    accessorKey: 'positionB',
    id: 'positionB',
    enableHiding: true,
    header: () => (
      <SortableHeader
        label='B'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='positionB'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.getValue('positionB')}</div>
    ),
  },
  {
    accessorKey: 'totalScore',
    id: 'totalScore',
    enableHiding: false,
    header: () => (
      <SortableHeader
        label='Total Score'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='totalScore'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div className='font-bold text-lg text-right'>{row.getValue('totalScore')}</div>
    ),
  },
]

