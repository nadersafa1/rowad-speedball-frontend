import { ColumnDef } from "@tanstack/react-table";
import { Player } from "@/types";
import { SortableHeader } from "./players-table-sortable-header";
import { DateCell } from "./players-table-cell-renderers";

export const createHiddenColumns = (
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (columnId: string) => void
): ColumnDef<Player>[] => [
  {
    accessorKey: "nameRtl",
    id: "nameRtl",
    header: () => (
      <SortableHeader
        label="RTL Name"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="nameRtl"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <div dir="rtl" className="text-right">
        {row.getValue("nameRtl") || "-"}
      </div>
    ),
    enableHiding: true,
  },
  {
    accessorKey: "age",
    id: "age",
    header: () => (
      <SortableHeader
        label="Age"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="dateOfBirth"
        onSort={() => onSort?.("age")}
      />
    ),
    cell: ({ row }) => <div>{row.getValue("age")}</div>,
    enableHiding: true,
  },
  {
    accessorKey: "dateOfBirth",
    id: "dateOfBirth",
    header: () => (
      <SortableHeader
        label="Date of Birth"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="dateOfBirth"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <DateCell date={row.getValue("dateOfBirth")} />,
    enableHiding: true,
  },
  {
    accessorKey: "createdAt",
    id: "createdAt",
    header: () => (
      <SortableHeader
        label="Created"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="createdAt"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <DateCell date={row.getValue("createdAt")} />,
    enableHiding: true,
  },
];

