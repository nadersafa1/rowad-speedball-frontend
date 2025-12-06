import { ColumnDef } from '@tanstack/react-table'
import { Event } from '@/types'
import { SortableHeader } from './events-table-sortable-header'
import {
  NameCell,
  EventTypeCell,
  GenderCell,
  FormatCell,
  CompletedCell,
  RegistrationsCountCell,
  LastMatchPlayedDateCell,
} from './events-table-cell-renderers'

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<Event>[] => [
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
    cell: ({ row }) => <NameCell event={row.original} />,
  },
  {
    accessorKey: 'eventType',
    id: 'eventType',
    header: () => (
      <SortableHeader
        label='Type'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='eventType'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <EventTypeCell eventType={row.getValue('eventType')} />,
  },
  {
    accessorKey: 'gender',
    id: 'gender',
    header: () => (
      <SortableHeader
        label='Gender'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='gender'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <GenderCell gender={row.getValue('gender')} />,
  },
  {
    accessorKey: 'format',
    id: 'format',
    header: () => <div>Format</div>,
    cell: ({ row }) => <FormatCell eventFormat={row.getValue('format')} />,
  },
  {
    accessorKey: 'completed',
    id: 'completed',
    header: () => (
      <SortableHeader
        label='Completed'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='completed'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <CompletedCell completed={row.getValue('completed')} />,
  },
  {
    accessorKey: 'organizationName',
    id: 'organizationName',
    header: () => <div>Club</div>,
    cell: ({ row }) => (
      <span className='text-sm'>{row.getValue('organizationName') || '—'}</span>
    ),
  },
  {
    accessorKey: 'bestOf',
    id: 'bestOf',
    header: () => <div>Best Of</div>,
    cell: ({ row }) => (
      <span className='text-sm'>{row.getValue('bestOf')}</span>
    ),
  },
  {
    accessorKey: 'registrationsCount',
    id: 'registrationsCount',
    header: () => (
      <SortableHeader
        label='Registrations'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='registrationsCount'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <RegistrationsCountCell count={row.getValue('registrationsCount')} />
    ),
  },
  {
    accessorKey: 'lastMatchPlayedDate',
    id: 'lastMatchPlayedDate',
    header: () => (
      <SortableHeader
        label='Last Match'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='lastMatchPlayedDate'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <LastMatchPlayedDateCell date={row.getValue('lastMatchPlayedDate')} />
    ),
  },
]
