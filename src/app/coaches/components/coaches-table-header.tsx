import { flexRender, Table } from '@tanstack/react-table'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Coach } from '@/db/schema'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

interface CoachesTableHeaderProps {
  table: Table<CoachWithOrg>
}

export const CoachesTableHeader = ({
  table,
}: CoachesTableHeaderProps) => {
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

