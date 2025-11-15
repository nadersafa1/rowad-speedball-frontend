import * as React from "react";
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { Event } from "@/types";

interface UseEventsTableProps {
  events: Event[];
  columns: ColumnDef<Event>[];
  totalPages: number;
}

export const useEventsTable = ({
  events,
  columns,
  totalPages,
}: UseEventsTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data: events,
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

