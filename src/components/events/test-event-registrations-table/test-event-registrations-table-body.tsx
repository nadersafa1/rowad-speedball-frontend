import { flexRender, Table } from '@tanstack/react-table'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'
import { RegistrationTableRow } from './test-event-registrations-table-types'

interface TestEventRegistrationsTableBodyProps {
  table: Table<RegistrationTableRow>
  columnsCount: number
  isLoading?: boolean
  searchQuery?: string
}

export const TestEventRegistrationsTableBody = ({
  table,
  columnsCount,
  isLoading = false,
  searchQuery,
}: TestEventRegistrationsTableBodyProps) => {
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
                No registrations found
              </p>
              <p className='text-sm text-muted-foreground'>
                {searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'No registrations match the current filters.'}
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

