import { flexRender, Table } from "@tanstack/react-table";
import {
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { Player } from "@/types";

interface PlayersTableBodyProps {
  table: Table<Player>;
  columnsCount: number;
  isLoading?: boolean;
  searchQuery?: string;
}

export const PlayersTableBody = ({
  table,
  columnsCount,
  isLoading = false,
  searchQuery,
}: PlayersTableBodyProps) => {
  if (isLoading) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columnsCount} className="h-24 text-center">
            Loading...
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (!table.getRowModel().rows?.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columnsCount} className="h-32 text-center">
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <p className="text-lg font-medium text-muted-foreground">
                No players found
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms or filters."
                  : "No players match the current filters."}
              </p>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {table.getRowModel().rows.map((row) => (
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
};

