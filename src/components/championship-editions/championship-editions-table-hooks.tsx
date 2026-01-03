import * as React from 'react'
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'

interface UseChampionshipEditionsTableProps {
  editions: ChampionshipEditionWithRelations[]
  columns: ColumnDef<ChampionshipEditionWithRelations>[]
  totalPages: number
}

export function useChampionshipEditionsTable({
  editions,
  columns,
  totalPages,
}: UseChampionshipEditionsTableProps) {
  const table = useReactTable({
    data: editions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: totalPages,
    manualPagination: true,
  })

  return { table }
}
