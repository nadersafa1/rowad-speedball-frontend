import * as React from 'react'
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ColumnDef } from '@tanstack/react-table'
import { ChampionshipWithFederation } from './championships-table-types'

interface UseChampionshipsTableProps {
  championships: ChampionshipWithFederation[]
  columns: ColumnDef<ChampionshipWithFederation>[]
  totalPages: number
}

export const useChampionshipsTable = ({
  championships,
  columns,
  totalPages,
}: UseChampionshipsTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      description: false,
      createdAt: false,
      updatedAt: false,
    })

  const table = useReactTable({
    data: championships,
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

