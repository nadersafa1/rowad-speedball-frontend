"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Registration } from "@/types";
import { Trophy } from "lucide-react";

interface StandingsTableProps {
  registrations: Registration[];
}

const StandingsTable = ({ registrations }: StandingsTableProps) => {
  // Sort by points (desc), then sets difference, then matches won
  const sortedRegistrations = [...registrations].sort((a, b) => {
    // Points
    if (b.points !== a.points) return b.points - a.points;
    // Sets difference
    const aSetsDiff = a.setsWon - a.setsLost;
    const bSetsDiff = b.setsWon - b.setsLost;
    if (bSetsDiff !== aSetsDiff) return bSetsDiff - aSetsDiff;
    // Matches won
    return b.matchesWon - a.matchesWon;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 sm:px-4">Position</TableHead>
                <TableHead className="px-2 sm:px-4">Player(s)</TableHead>
                <TableHead className="text-center px-2 sm:px-4">Matches</TableHead>
                <TableHead className="text-center px-2 sm:px-4">Sets</TableHead>
                <TableHead className="text-center px-2 sm:px-4">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground px-2 sm:px-4">
                    No registrations yet
                  </TableCell>
                </TableRow>
              ) : (
                sortedRegistrations.map((reg, index) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium px-2 sm:px-4">{index + 1}</TableCell>
                    <TableCell className="px-2 sm:px-4 break-words">
                      {reg.player1?.name}
                      {reg.player2 && ` & ${reg.player2.name}`}
                    </TableCell>
                    <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                      {reg.matchesWon}W - {reg.matchesLost}L
                    </TableCell>
                    <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                      {reg.setsWon}W - {reg.setsLost}L
                    </TableCell>
                    <TableCell className="text-center font-bold px-2 sm:px-4 text-sm sm:text-base">
                      {reg.points}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandingsTable;

