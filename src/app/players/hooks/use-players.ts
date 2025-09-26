import { usePlayersStore } from "@/store/players-store";
import { PlayersFilters } from "../types";
import { useEffect, useCallback } from "react";

export const usePlayers = (filters: PlayersFilters) => {
  const { players, isLoading, error, pagination, fetchPlayers, clearError } =
    usePlayersStore();

  // Fetch players when filters change
  useEffect(() => {
    fetchPlayers(filters);
  }, [filters, fetchPlayers]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchPlayers({ ...filters, page });
    },
    [filters, fetchPlayers]
  );

  const refetch = useCallback(() => {
    fetchPlayers(filters);
  }, [filters, fetchPlayers]);

  return {
    players,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  };
};
