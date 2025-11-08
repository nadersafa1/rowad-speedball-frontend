import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ResultWithPlayer, SortableField } from "./results-table-types";

// SortableHeader Component
interface SortableHeaderProps {
  label: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  field: SortableField;
  onSort?: (columnId: string) => void;
}

const SortableHeader = ({
  label,
  sortBy,
  sortOrder,
  field,
  onSort,
}: SortableHeaderProps) => {
  const isSorted = sortBy === field;
  const isAsc = isSorted && sortOrder === "asc";
  const isDesc = isSorted && sortOrder === "desc";

  return (
    <Button variant="ghost" onClick={() => onSort?.(field)}>
      {label}
      {isSorted ? (
        isAsc ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
};

// Cell Renderers
const RankCell = ({ rank }: { rank: number }) => (
  <div className="font-bold text-gray-500">#{rank}</div>
);

const PlayerNameCell = ({
  player,
  name,
}: {
  player?: { id: string; name: string } | null;
  name: string;
}) => {
  if (!player) return <div>{name}</div>;
  return (
    <Link
      href={`/players/${player.id}`}
      className="font-medium text-rowad-600 hover:text-rowad-700 hover:underline transition-colors"
    >
      {name}
    </Link>
  );
};

const GenderCell = ({ gender }: { gender: string }) => (
  <Badge variant={gender === "male" ? "default" : "secondary"}>
    {gender === "male" ? "👨" : "👩"}{" "}
    {gender.charAt(0).toUpperCase() + gender.slice(1)}
  </Badge>
);

const AgeGroupCell = ({ ageGroup }: { ageGroup?: string }) => (
  <div className="font-medium text-speedball-600">{ageGroup || "-"}</div>
);

const AgeCell = ({ age }: { age?: number }) => (
  <div>{age !== undefined ? age : "-"}</div>
);

const ScoreCell = ({ score }: { score: number }) => (
  <div className="text-center font-medium">{score}</div>
);

const TotalScoreCell = ({ score }: { score: number }) => (
  <div className="text-center font-bold text-blue-600">{score}</div>
);

// Base Columns
export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (columnId: string) => void,
  startRank: number = 1
): ColumnDef<ResultWithPlayer>[] => [
  {
    id: "rank",
    header: () => <div className="font-bold">Rank</div>,
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      const rank = pageIndex * pageSize + row.index + startRank;
      return <RankCell rank={rank} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "player.name",
    id: "playerName",
    header: () => (
      <SortableHeader
        label="Player Name"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="playerName"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => {
      const player = row.original.player;
      return (
        <PlayerNameCell
          player={player}
          name={player?.name || "Unknown"}
        />
      );
    },
  },
  {
    accessorKey: "player.gender",
    id: "gender",
    header: () => <div>Gender</div>,
    cell: ({ row }) => {
      const gender = row.original.player?.gender;
      return gender ? <GenderCell gender={gender} /> : <div>-</div>;
    },
  },
  {
    accessorKey: "player.ageGroup",
    id: "ageGroup",
    header: () => (
      <SortableHeader
        label="Age Group"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="ageGroup"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <AgeGroupCell ageGroup={row.original.player?.ageGroup} />
    ),
  },
  {
    accessorKey: "leftHandScore",
    id: "leftHandScore",
    header: () => (
      <SortableHeader
        label="Left Hand"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="leftHandScore"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <ScoreCell score={row.getValue("leftHandScore")} />,
  },
  {
    accessorKey: "rightHandScore",
    id: "rightHandScore",
    header: () => (
      <SortableHeader
        label="Right Hand"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="rightHandScore"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <ScoreCell score={row.getValue("rightHandScore")} />,
  },
  {
    accessorKey: "forehandScore",
    id: "forehandScore",
    header: () => (
      <SortableHeader
        label="Forehand"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="forehandScore"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <ScoreCell score={row.getValue("forehandScore")} />,
  },
  {
    accessorKey: "backhandScore",
    id: "backhandScore",
    header: () => (
      <SortableHeader
        label="Backhand"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="backhandScore"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <ScoreCell score={row.getValue("backhandScore")} />,
  },
  {
    accessorKey: "totalScore",
    id: "totalScore",
    header: () => (
      <SortableHeader
        label="Total Score"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="totalScore"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <TotalScoreCell score={row.getValue("totalScore")} />,
    enableHiding: false,
  },
];

// Hidden Columns
export const createHiddenColumns = (
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (columnId: string) => void
): ColumnDef<ResultWithPlayer>[] => [
  {
    accessorKey: "player.age",
    id: "age",
    header: () => (
      <SortableHeader
        label="Age"
        sortBy={sortBy}
        sortOrder={sortOrder}
        field="age"
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <AgeCell age={row.original.player?.age} />,
    enableHiding: true,
  },
];

// Main Column Factory
export const createColumns = (
  isAdmin: boolean,
  onEdit: (result: ResultWithPlayer) => void,
  onDelete: (result: ResultWithPlayer) => void,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
  onSort?: (columnId: string) => void,
  startRank: number = 1
): ColumnDef<ResultWithPlayer>[] => {
  const baseColumns = createBaseColumns(sortBy, sortOrder, onSort, startRank);
  const hiddenColumns = createHiddenColumns(sortBy, sortOrder, onSort);
  
  // Actions column will be added in the main table component
  return [...baseColumns, ...hiddenColumns];
};

