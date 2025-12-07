import * as React from 'react'
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ColumnDef } from '@tanstack/react-table'
import type { Federation } from '@/db/schema'

interface UseFederationsTableProps {
  federations: Federation[]
  columns: ColumnDef<Federation>[]
  totalPages: number
}

export const useFederationsTable = ({
  federations,
  columns,
  totalPages,
}: UseFederationsTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      createdAt: false,
      updatedAt: false,
    })

  const table = useReactTable({
    data: federations,
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

