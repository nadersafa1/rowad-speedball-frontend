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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Position</TableHead>
              <TableHead>Player(s)</TableHead>
              <TableHead className="text-center">Matches</TableHead>
              <TableHead className="text-center">Sets</TableHead>
              <TableHead className="text-center">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No registrations yet
                </TableCell>
              </TableRow>
            ) : (
              sortedRegistrations.map((reg, index) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    {reg.player1?.name}
                    {reg.player2 && ` & ${reg.player2.name}`}
                  </TableCell>
                  <TableCell className="text-center">
                    {reg.matchesWon}W - {reg.matchesLost}L
                  </TableCell>
                  <TableCell className="text-center">
                    {reg.setsWon}W - {reg.setsLost}L
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {reg.points}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StandingsTable;

