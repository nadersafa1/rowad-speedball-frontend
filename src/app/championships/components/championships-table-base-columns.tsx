import { ColumnDef } from '@tanstack/react-table'
import { SortableHeader } from './championships-table-sortable-header'
import {
  NameCell,
  DescriptionCell,
  FederationCell,
  CompetitionScopeCell,
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
    cell: ({ row }) => (
      <NameCell name={row.getValue('name')} id={row.original.id} />
    ),
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
    accessorKey: 'competitionScope',
    id: 'competitionScope',
    header: () => (
      <SortableHeader
        label='Competition Scope'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='competitionScope'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <CompetitionScopeCell competitionScope={row.getValue('competitionScope')} />
    ),
  },
]
