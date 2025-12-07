"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import type { Registration } from "@/types";

interface StandingsTableRowProps {
  registration: Registration;
  position: number;
}

export const StandingsTableRow = ({
  registration,
  position,
}: StandingsTableRowProps) => {
  const matchesPlayed = registration.matchesWon + registration.matchesLost;
  const setsDifference = registration.setsWon - registration.setsLost;

  const playerNames =
    registration.players && registration.players.length > 0
      ? registration.players.map((p) => p.name).join(" & ")
      : "Unknown";

  return (
    <TableRow>
      <TableCell className="font-medium w-12 px-2 sm:px-4">{position}</TableCell>
      <TableCell className="px-2 sm:px-4 break-words">{playerNames}</TableCell>
      <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
        {matchesPlayed}
      </TableCell>
      <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
        {registration.matchesWon}
      </TableCell>
      <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
        {registration.matchesLost}
      </TableCell>
      <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
        {registration.setsWon}
      </TableCell>
      <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
        {registration.setsLost}
      </TableCell>
      <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
        {setsDifference}
      </TableCell>
      <TableCell className="text-center font-bold px-2 sm:px-4 text-sm sm:text-base">
        {registration.points}
      </TableCell>
    </TableRow>
  );
};

