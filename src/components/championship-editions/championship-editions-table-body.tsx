import { flexRender, Table as ReactTable } from '@tanstack/react-table'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'

interface ChampionshipEditionsTableBodyProps {
  table: ReactTable<ChampionshipEditionWithRelations>
  columnsCount: number
  isLoading?: boolean
  searchQuery?: string
}

export function ChampionshipEditionsTableBody({
  table,
  columnsCount,
  isLoading = false,
  searchQuery = '',
}: ChampionshipEditionsTableBodyProps) {
  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columnsCount} className='h-24 text-center'>
            Loading...
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  if (table.getRowModel().rows?.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columnsCount} className='h-24 text-center'>
            {searchQuery
              ? 'No championship editions found matching your search.'
              : 'No championship editions found.'}
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  return (
    <TableBody>
      {table.getRowModel().rows.map((row) => (
        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
