import { ColumnDef } from '@tanstack/react-table'
import { Coach } from '@/db/schema'
import { SortableHeader } from './coaches-table-sortable-header'
import {
  NameCell,
  GenderCell,
  ClubCell,
} from './coaches-table-cell-renderers'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void
): ColumnDef<CoachWithOrg>[] => [
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
      <NameCell coach={row.original} name={row.getValue('name')} />
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

