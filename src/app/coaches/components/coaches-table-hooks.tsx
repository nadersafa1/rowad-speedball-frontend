import * as React from 'react'
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ColumnDef } from '@tanstack/react-table'
import { Coach } from '@/db/schema'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

interface UseCoachesTableProps {
  coaches: CoachWithOrg[]
  columns: ColumnDef<CoachWithOrg>[]
  totalPages: number
}

export const useCoachesTable = ({
  coaches,
  columns,
  totalPages,
}: UseCoachesTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      createdAt: false,
    })

  const table = useReactTable({
    data: coaches,
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

