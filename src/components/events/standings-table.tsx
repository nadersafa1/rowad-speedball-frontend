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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 px-2 sm:px-4">Position</TableHead>
                  <TableHead className="px-2 sm:px-4">Player(s)</TableHead>
                  <TableHead className="text-center px-2 sm:px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">MP</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Matches Played - Total number of matches completed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-center px-2 sm:px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">W</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Wins - Number of matches won</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-center px-2 sm:px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">L</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Losses - Number of matches lost</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-center px-2 sm:px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">SF</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sets For - Total sets won</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-center px-2 sm:px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">SA</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sets Against - Total sets lost</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-center px-2 sm:px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help">SD</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sets Difference - Difference between sets won and sets lost (SF - SA)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  <TableHead className="text-center px-2 sm:px-4">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground px-2 sm:px-4">
                      No registrations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRegistrations.map((reg, index) => {
                    const matchesPlayed = reg.matchesWon + reg.matchesLost;
                    const setsDifference = reg.setsWon - reg.setsLost;
                    
                    // Use new players array if available, fallback to player1/player2
                    const playerNames = reg.players && reg.players.length > 0
                      ? reg.players.map((p) => p.name).join(' & ')
                      : [reg.player1?.name, reg.player2?.name].filter(Boolean).join(' & ') || 'Unknown';
                    
                    return (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium w-12 px-2 sm:px-4">{index + 1}</TableCell>
                        <TableCell className="px-2 sm:px-4 break-words">
                          {playerNames}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                          {matchesPlayed}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                          {reg.matchesWon}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                          {reg.matchesLost}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                          {reg.setsWon}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                          {reg.setsLost}
                        </TableCell>
                        <TableCell className="text-center px-2 sm:px-4 text-sm sm:text-base">
                          {setsDifference}
                        </TableCell>
                        <TableCell className="text-center font-bold px-2 sm:px-4 text-sm sm:text-base">
                          {reg.points}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandingsTable;

