import { ColumnDef } from "@tanstack/react-table";
import { Event } from "@/types";
import { EventsTableActions } from "./events-table-actions";
import { createBaseColumns } from "./events-table-base-columns";

export const createColumns = (
  isAdmin: boolean,
  onEdit: (event: Event) => void,
  onDelete: (event: Event) => void,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (columnId: string) => void
): ColumnDef<Event>[] => [
  ...createBaseColumns(sortBy, sortOrder, onSort),
  {
    id: "actions",
    enableHiding: false,
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <EventsTableActions
          event={row.original}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    ),
  },
];

