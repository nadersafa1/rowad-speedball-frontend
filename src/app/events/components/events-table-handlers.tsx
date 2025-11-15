import * as React from "react";
import { Event } from "@/types";
import { useEventsStore } from "@/store/events-store";
import { toast } from "sonner";

type SortableField =
  | "name"
  | "eventType"
  | "gender"
  | "completed"
  | "registrationsCount"
  | "lastMatchPlayedDate";

interface UseEventsTableHandlersProps {
  onRefetch?: () => void;
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: "asc" | "desc"
  ) => void;
  sortBy?: SortableField;
  sortOrder?: "asc" | "desc";
}

const columnToApiFieldMap: Record<string, SortableField> = {
  name: "name",
  eventType: "eventType",
  gender: "gender",
  completed: "completed",
  registrationsCount: "registrationsCount",
  lastMatchPlayedDate: "lastMatchPlayedDate",
};

export const useEventsTableHandlers = ({
  onRefetch,
  onSortingChange,
  sortBy,
  sortOrder,
}: UseEventsTableHandlersProps) => {
  const { deleteEvent } = useEventsStore();
  const [editEvent, setEditEvent] = React.useState<Event | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);

  const handleEdit = React.useCallback((event: Event) => {
    setEditEvent(event);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (event: Event) => {
      try {
        await deleteEvent(event.id);
        toast.success("Event deleted successfully");
        onRefetch?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete event"
        );
      }
    },
    [deleteEvent, onRefetch]
  );

  const handleEditSuccess = React.useCallback(() => {
    setEditDialogOpen(false);
    setEditEvent(null);
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
    editEvent,
    editDialogOpen,
    setEditDialogOpen,
    setEditEvent,
    handleEdit,
    handleDelete,
    handleEditSuccess,
    handleSort,
  };
};

