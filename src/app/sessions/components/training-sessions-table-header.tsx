import { flexRender, Table } from '@tanstack/react-table'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrainingSession, Coach } from '@/db/schema'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

interface TrainingSessionsTableHeaderProps {
  table: Table<TrainingSessionWithCoaches>
}

export const TrainingSessionsTableHeader = ({
  table,
}: TrainingSessionsTableHeaderProps) => {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead
              key={header.id}
              className='whitespace-nowrap px-2 sm:px-4'
            >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
}

