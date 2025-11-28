import { ColumnDef } from '@tanstack/react-table'
import { Player } from '@/types'
import { SortableHeader } from './players-table-sortable-header'
import {
  NameCell,
  GenderCell,
  AgeGroupCell,
  PreferredHandCell,
  ClubCell,
} from './players-table-cell-renderers'

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<Player>[] => [
  {
    accessorKey: 'name',
    id: 'name',
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
      <NameCell player={row.original} name={row.getValue('name')} />
    ),
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
    accessorKey: 'ageGroup',
    id: 'ageGroup',
    header: () => (
      <SortableHeader
        label='Age Group'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='dateOfBirth'
        onSort={() => onSort?.('ageGroup')}
      />
    ),
    cell: ({ row }) => <AgeGroupCell ageGroup={row.getValue('ageGroup')} />,
  },
  {
    accessorKey: 'preferredHand',
    id: 'preferredHand',
    header: () => (
      <SortableHeader
        label='Preferred Hand'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='preferredHand'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <PreferredHandCell hand={row.getValue('preferredHand')} />
    ),
  },
  {
    accessorKey: 'organizationName',
    id: 'organizationId',
    enableHiding: false,
    header: () => (
      <SortableHeader
        label='Organization'
        sortBy={sortBy}
        sortOrder={sortOrder}
        field='organizationId'
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <ClubCell organizationName={row.original.organizationName} />
    ),
  },
]
