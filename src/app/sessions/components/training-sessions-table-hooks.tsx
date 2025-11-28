import * as React from 'react'
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ColumnDef } from '@tanstack/react-table'
import { TrainingSession, Coach } from '@/db/schema'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

interface UseTrainingSessionsTableProps {
  trainingSessions: TrainingSessionWithCoaches[]
  columns: ColumnDef<TrainingSessionWithCoaches>[]
  totalPages: number
}

export const useTrainingSessionsTable = ({
  trainingSessions,
  columns,
  totalPages,
}: UseTrainingSessionsTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const table = useReactTable({
    data: trainingSessions,
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

