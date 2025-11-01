"use client";

import PlayerForm from "@/components/players/player-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui";
import Pagination from "@/components/ui/pagination";
import { authClient } from "@/lib/auth-client";
import { useAdminPermission } from "@/hooks/use-admin-permission";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import PlayerCard from "./components/player-card";
import PlayersFiltersSection from "./components/players-filters";
import PlayersStats from "./components/players-stats";
import { usePlayers } from "./hooks/use-players";
import { PlayersFilters } from "./types";
import { AgeGroup, Gender } from "./types/enums";

const PlayersPage = () => {
  const { isAdmin } = useAdminPermission();
  const [playerFormOpen, setPlayerFormOpen] = useState(false);

  // Local filter state
  const [filters, setFilters] = useState<PlayersFilters>({
    q: "",
    gender: Gender.ALL,
    ageGroup: AgeGroup.ALL,
    page: 1,
    limit: 12,
  });

  const {
    players,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = usePlayers(filters);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={clearError} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <PageHeader
        icon={Users}
        title="Players Archive"
        description="Browse and manage all registered players"
        actionDialog={
          isAdmin
            ? {
                open: playerFormOpen,
                onOpenChange: setPlayerFormOpen,
                trigger: (
                  <Button className="gap-2 bg-rowad-600 hover:bg-rowad-700">
                    <Plus className="h-4 w-4" />
                    Add Player
                  </Button>
                ),
                content: (
                  <PlayerForm
                    onSuccess={() => {
                      setPlayerFormOpen(false);
                      refetch();
                    }}
                    onCancel={() => setPlayerFormOpen(false)}
                  />
                ),
              }
            : undefined
        }
      />

      {/* Filters */}
      <PlayersFiltersSection filters={filters} setFilters={setFilters} />

      {/* Players Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : players.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No players found"
          description={
            filters.q
              ? "Try adjusting your search terms."
              : "No players have been registered yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {players.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Stats */}
      <PlayersStats />
    </div>
  );
};

export default PlayersPage;
