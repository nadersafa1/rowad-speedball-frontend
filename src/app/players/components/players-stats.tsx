import { Card, CardContent } from "@/components/ui/card";
import { usePlayersStore } from "@/store/players-store";
import React from "react";

const PlayersStats = () => {
  const { players, pagination } = usePlayersStore();
  return (
    <>
      {players.length > 0 && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{pagination.totalItems}</p>
                <p className="text-muted-foreground text-sm">Total Players</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p) => p.gender === "male").length}
                </p>
                <p className="text-muted-foreground text-sm">
                  Male (Current Page)
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p) => p.gender === "female").length}
                </p>
                <p className="text-muted-foreground text-sm">
                  Female (Current Page)
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(players.map((p) => p.ageGroup)).size}
                </p>
                <p className="text-muted-foreground text-sm">
                  Age Groups (Current Page)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default PlayersStats;
