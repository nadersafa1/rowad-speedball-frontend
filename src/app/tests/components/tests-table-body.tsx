import { flexRender, Table } from '@tanstack/react-table'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { Test } from '@/types'

interface TestsTableBodyProps {
  table: Table<Test>
  columnsCount: number
  isLoading?: boolean
  searchQuery?: string
}

export const TestsTableBody = ({
  table,
  columnsCount,
  isLoading = false,
  searchQuery,
}: TestsTableBodyProps) => {
  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={columnsCount}
            className='h-24 text-center px-2 sm:px-4'
          >
            Loading...
          </TableCell>
        </TableRow>
      </TableBody>
    )
  }

  if (!table.getRowModel().rows?.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={columnsCount}
            className='h-32 text-center px-2 sm:px-4'
          >
            <div className='flex flex-col items-center justify-center gap-2 py-4'>
              <p className='text-lg font-medium text-muted-foreground'>
                No tests found
              </p>
              <p className='text-sm text-muted-foreground'>
                {searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'No tests match the current filters.'}
              </p>
            </div>
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
            <TableCell
              key={cell.id}
              className='px-2 sm:px-4 whitespace-nowrap'
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}

