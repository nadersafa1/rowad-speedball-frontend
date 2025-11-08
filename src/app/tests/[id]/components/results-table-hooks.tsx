import * as React from "react";
import {
  VisibilityState,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { ResultWithPlayer, SortableField } from "./results-table-types";
import { useResultsStore } from "@/store/results-store";
import { toast } from "sonner";
import { columnToApiFieldMap } from "./results-table-types";

interface UseResultsTableHandlersProps {
  onRefetch?: () => void;
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: "asc" | "desc"
  ) => void;
  sortBy?: SortableField;
  sortOrder?: "asc" | "desc";
}

export const useResultsTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseResultsTableHandlersProps) => {
  const { deleteResult } = useResultsStore();
  const [editResult, setEditResult] = React.useState<ResultWithPlayer | null>(
    null
  );
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const handleEdit = React.useCallback((result: ResultWithPlayer) => {
    setEditResult(result);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (result: ResultWithPlayer) => {
      try {
        await deleteResult(result.id);
        toast.success("Result deleted successfully");
        onRefetch?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete result"
        );
      }
    },
    [deleteResult, onRefetch]
  );

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false);
    setEditResult(null);
    onRefetch?.();
  }, [onRefetch]);

  const handleSort = React.useCallback(
    (columnId: string) => {
      if (!onSortingChange) return;
      const apiField = columnToApiFieldMap[columnId];
      if (!apiField) return;

      if (sortBy === apiField) {
        const newOrder = sortOrder === "asc" ? "desc" : "asc";
        onSortingChange(apiField, newOrder);
      } else {
        onSortingChange(apiField, "desc");
      }
    },
    [onSortingChange, sortBy, sortOrder]
  );

  return {
    editResult,
    editDialogOpen,
    setEditDialogOpen,
    setEditResult,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  };
};

interface UseResultsTableProps {
  results: ResultWithPlayer[];
  columns: ColumnDef<ResultWithPlayer>[];
  totalPages: number;
}

export const useResultsTable = ({
  results,
  columns,
  totalPages,
}: UseResultsTableProps) => {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      age: false,
    });

  const table = useReactTable({
    data: results,
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

