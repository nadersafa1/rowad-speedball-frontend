import * as React from "react";
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Player } from "@/types";

interface UsePlayersTableProps {
  players: Player[];
  columns: ColumnDef<Player>[];
  totalPages: number;
}

export const usePlayersTable = ({
  players,
  columns,
  totalPages,
}: UsePlayersTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      age: false,
      dateOfBirth: false,
      createdAt: false,
    });

  const table = useReactTable({
    data: players,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
    state: {
      columnVisibility,
    },
  });

  return { table };
};

