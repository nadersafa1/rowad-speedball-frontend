import * as React from 'react'
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ColumnDef } from '@tanstack/react-table'
import { Test } from '@/types'

interface UseTestsTableProps {
  tests: Test[]
  columns: ColumnDef<Test>[]
  totalPages: number
}

export const useTestsTable = ({
  tests,
  columns,
  totalPages,
}: UseTestsTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const table = useReactTable({
    data: tests,
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

