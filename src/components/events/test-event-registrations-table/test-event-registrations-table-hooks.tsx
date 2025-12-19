import * as React from 'react'
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ColumnDef } from '@tanstack/react-table'
import { RegistrationTableRow } from './test-event-registrations-table-types'

interface UseTestEventRegistrationsTableProps {
  rows: RegistrationTableRow[]
  columns: ColumnDef<RegistrationTableRow>[]
  totalPages: number
}

export const useTestEventRegistrationsTable = ({
  rows,
  columns,
  totalPages,
}: UseTestEventRegistrationsTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      columnVisibility,
    },
  })

  return { table }
}

