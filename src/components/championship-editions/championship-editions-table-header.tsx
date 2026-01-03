import { flexRender, Table as ReactTable } from '@tanstack/react-table'
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'

interface ChampionshipEditionsTableHeaderProps {
  table: ReactTable<ChampionshipEditionWithRelations>
}

export function ChampionshipEditionsTableHeader({
  table,
}: ChampionshipEditionsTableHeaderProps) {
  return (
    <TableHeader>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
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
