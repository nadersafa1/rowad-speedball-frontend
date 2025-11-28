'use client'

import { TableBody, TableRow, TableCell } from '@/components/ui/table'
import { flexRender, Table } from '@tanstack/react-table'
import type { AttendanceRecord } from '@/hooks/use-training-session-attendance'
import { Loader2 } from 'lucide-react'

interface AttendanceTableBodyProps {
  table: Table<AttendanceRecord>
  columnsCount: number
  isLoading?: boolean
  searchQuery?: string
}

export const AttendanceTableBody = ({
  table,
  columnsCount,
  isLoading = false,
  searchQuery,
}: AttendanceTableBodyProps) => {
  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell
            colSpan={columnsCount}
            className='h-24 text-center px-2 sm:px-4'
          >
            <div className='flex items-center justify-center gap-2'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Loading...
            </div>
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
                No attendance records found
              </p>
              <p className='text-sm text-muted-foreground'>
                {searchQuery
                  ? 'Try adjusting your search terms or filters.'
                  : 'No players match the current filters.'}
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
            <TableCell key={cell.id} className='px-2 sm:px-4 whitespace-nowrap'>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
