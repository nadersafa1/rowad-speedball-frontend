import { ColumnDef } from '@tanstack/react-table'
import { Test } from '@/types'
import { SortableHeader } from './tests-table-sortable-header'
import {
  NameCell,
  TestTypeCell,
  DateConductedCell,
  StatusCell,
  OrganizationNameCell,
  DescriptionCell,
  TotalTimeCell,
} from './tests-table-cell-renderers'

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  isSystemAdmin?: boolean
): ColumnDef<Test>[] => {
  const columns: ColumnDef<Test>[] = [
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
      cell: ({ row }) => <NameCell test={row.original} />,
    },
    {
      accessorKey: 'testType',
      id: 'testType',
      header: () => <div>Test Type</div>,
      cell: ({ row }) => <TestTypeCell test={row.original} />,
    },
    {
      accessorKey: 'dateConducted',
      id: 'dateConducted',
      header: () => (
        <SortableHeader
          label='Date Conducted'
          sortBy={sortBy}
          sortOrder={sortOrder}
          field='dateConducted'
          onSort={onSort}
        />
      ),
      cell: ({ row }) => (
        <DateConductedCell dateConducted={row.getValue('dateConducted')} />
      ),
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: () => <div>Status</div>,
      cell: ({ row }) => <StatusCell status={row.getValue('status')} />,
    },
  ]

  // Add organization column only for system admin
  if (isSystemAdmin) {
    columns.push({
      accessorKey: 'organizationName',
      id: 'organizationName',
      header: () => <div>Club</div>,
      cell: ({ row }) => (
        <OrganizationNameCell
          organizationName={row.getValue('organizationName')}
        />
      ),
    })
  }

  // Add description and total time columns
  columns.push(
    {
      accessorKey: 'description',
      id: 'description',
      header: () => <div>Description</div>,
      cell: ({ row }) => (
        <DescriptionCell description={row.getValue('description')} />
      ),
    },
    {
      accessorKey: 'formattedTotalTime',
      id: 'totalTime',
      header: () => <div>Total Time</div>,
      cell: ({ row }) => (
        <TotalTimeCell formattedTotalTime={row.original.formattedTotalTime} />
      ),
    }
  )

  return columns
}

