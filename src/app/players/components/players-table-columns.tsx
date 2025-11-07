import { ColumnDef } from "@tanstack/react-table";
import { Player } from "@/types";
import { PlayersTableActions } from "./players-table-actions";
import { createBaseColumns } from "./players-table-base-columns";
import { createHiddenColumns } from "./players-table-hidden-columns";

export const createColumns = (
  isAdmin: boolean,
  onEdit: (player: Player) => void,
  onDelete: (player: Player) => void,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (columnId: string) => void
): ColumnDef<Player>[] => [
  ...createBaseColumns(sortBy, sortOrder, onSort),
  ...createHiddenColumns(sortBy, sortOrder, onSort),
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <PlayersTableActions
        player={row.original}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    ),
  },
];
