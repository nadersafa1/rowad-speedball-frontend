'use client'

import { TableHeader, TableRow, TableHead } from '@/components/ui/table'
import { flexRender, Table } from '@tanstack/react-table'
import type { AttendanceRecord } from '@/hooks/use-training-session-attendance'

interface AttendanceTableHeaderProps {
  table: Table<AttendanceRecord>
}

export const AttendanceTableHeader = ({
  table,
}: AttendanceTableHeaderProps) => {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className='px-2 sm:px-4'
              style={{
                width: header.getSize() !== 150 ? header.getSize() : undefined,
              }}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
}
