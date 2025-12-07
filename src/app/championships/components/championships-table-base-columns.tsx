import { ColumnDef } from '@tanstack/react-table'
import { SortableHeader } from './championships-table-sortable-header'
import {
  NameCell,
  DescriptionCell,
  FederationCell,
  DateCell,
} from './championships-table-cell-renderers'
import { ChampionshipWithFederation } from './championships-table-types'

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<ChampionshipWithFederation>[] => [
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
    accessorKey: 'federationName',
    id: 'federationName',
    enableHiding: false,
    header: 'Federation',
    cell: ({ row }) => (
      <FederationCell federationName={row.getValue('federationName')} />
    ),
  },
  {
    accessorKey: 'description',
    id: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <DescriptionCell description={row.getValue('description')} />
    ),
  },
  {
    accessorKey: 'startDate',
    id: 'startDate',
    header: () => (
      <SortableHeader
        label='Start Date'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='startDate'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <DateCell date={row.getValue('startDate')} />,
  },
  {
    accessorKey: 'endDate',
    id: 'endDate',
    header: () => (
      <SortableHeader
        label='End Date'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='endDate'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <DateCell date={row.getValue('endDate')} />,
  },
]
