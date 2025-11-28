import { ColumnDef } from "@tanstack/react-table";
import { Event } from "@/types";
import { EventsTableActions } from "./events-table-actions";
import { createBaseColumns } from "./events-table-base-columns";

export const createColumns = (
  canEdit: boolean,
  canDelete: boolean,
  onEdit: (event: Event) => void,
  onDelete: (event: Event) => void,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (columnId: string) => void
): ColumnDef<Event>[] => {
  const baseColumns = createBaseColumns(sortBy, sortOrder, onSort);
  
  // Only add actions column if user can edit or delete
  if (!canEdit && !canDelete) {
    return baseColumns;
  }

  return [
    ...baseColumns,
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <EventsTableActions
            event={row.original}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      ),
    },
  ];
};

