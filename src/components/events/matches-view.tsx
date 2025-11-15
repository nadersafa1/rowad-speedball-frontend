"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import type { Match, Group } from "@/types";
import { Trophy, Edit, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import MatchResultsForm from "./match-results-form";

interface MatchesViewProps {
  matches: Match[];
  groups?: Group[];
  groupMode?: 'single' | 'multiple';
  isAdmin?: boolean;
  onMatchUpdate?: () => void;
}

const MatchesView = ({
  matches,
  groups = [],
  groupMode = 'single',
  isAdmin = false,
  onMatchUpdate,
}: MatchesViewProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Helper function to get group name by ID
  const getGroupName = (groupId: string | null | undefined): string | null => {
    if (!groupId || groupMode === 'single') return null;
    const group = groups.find((g) => g.id === groupId);
    return group?.name || null;
  };

  // Helper function to format player names from a registration
  const formatRegistrationName = (registration: Match['registration1']) => {
    if (!registration) return 'Unknown';
    if (registration.player2) {
      // Doubles: "Player1 & Player2"
      return `${registration.player1?.name || 'Unknown'} & ${registration.player2?.name || 'Unknown'}`;
    }
    // Singles: just player name
    return registration.player1?.name || 'Unknown';
  };

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <Card key={round}>
          <CardHeader>
            <CardTitle>Round {round}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchesByRound[round].map((match) => (
                <div
                  key={match.id}
                  className="p-3 sm:p-4 border rounded-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-medium text-sm sm:text-base">
                          Match {match.matchNumber}
                        </span>
                        {groupMode === 'multiple' && match.groupId && (
                          <Badge variant="outline" className="text-xs">
                            Group {getGroupName(match.groupId)}
                          </Badge>
                        )}
                        {match.matchDate ? (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(match.matchDate), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            No date
                          </Badge>
                        )}
                        {match.played && (
                          <Badge variant="default" className="text-xs">Completed</Badge>
                        )}
                        {match.winnerId && (
                          <Badge variant="secondary" className="text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            Winner
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm sm:text-base font-medium break-words">
                        {formatRegistrationName(match.registration1)} vs{' '}
                        {formatRegistrationName(match.registration2)}
                      </div>
                    </div>
                    {isAdmin && !match.played && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMatch(match)}
                        className="w-full sm:w-auto min-w-[44px] min-h-[44px]"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        <span className="sm:inline">Edit Results</span>
                      </Button>
                    )}
                  </div>

                  {match.sets && match.sets.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 text-sm">
                      <div>
                        <p className="font-medium break-words">
                          {formatRegistrationName(match.registration1)}
                        </p>
                        <p className="text-muted-foreground">
                          Sets:{' '}
                          {match.sets.filter(
                            (s) =>
                              s.played &&
                              s.registration1Score > s.registration2Score
                          ).length}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium break-words">
                          {formatRegistrationName(match.registration2)}
                        </p>
                        <p className="text-muted-foreground">
                          Sets:{' '}
                          {match.sets.filter(
                            (s) =>
                              s.played &&
                              s.registration2Score > s.registration1Score
                          ).length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog
        open={selectedMatch !== null}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        {selectedMatch && (
          <MatchResultsForm
            match={selectedMatch}
            onSuccess={() => {
              setSelectedMatch(null);
              onMatchUpdate?.();
            }}
            onCancel={() => setSelectedMatch(null)}
          />
        )}
      </Dialog>
    </div>
  );
};

export default MatchesView;

