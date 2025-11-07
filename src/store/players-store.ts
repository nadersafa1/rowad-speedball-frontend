// Players Store - Single responsibility: Players state management
import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import type { Player, PlayerWithResults, PaginatedResponse } from "@/types";
import { PlayersFilters } from "@/app/players/types";

interface PlayersState {
  players: Player[];
  selectedPlayer: PlayerWithResults | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };

  // Actions
  fetchPlayers: (filters?: PlayersFilters) => Promise<void>;
  fetchPlayer: (id: string) => Promise<void>;
  createPlayer: (data: any) => Promise<void>;
  updatePlayer: (id: string, data: any) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  clearError: () => void;
  clearSelectedPlayer: () => void;
}

export const usePlayersStore = create<PlayersState>((set, get) => ({
  players: [],
  selectedPlayer: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchPlayers: async (filters = {}) => {
    set({ isLoading: true, error: null });

    try {
      const params = {
        q: filters.q,
        gender: filters.gender as any,
        ageGroup: filters.ageGroup,
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      const response = (await apiClient.getPlayers(
        params
      )) as PaginatedResponse<Player>;

      set({
        players: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch players",
        isLoading: false,
      });
    }
  },

  fetchPlayer: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const player = (await apiClient.getPlayer(id)) as PlayerWithResults;
      set({ selectedPlayer: player, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch player",
        isLoading: false,
      });
    }
  },

  createPlayer: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      // Convert dateOfBirth from Date to ISO string if it's a Date object
      const formattedData = {
        ...data,
        dateOfBirth:
          data.dateOfBirth instanceof Date
            ? data.dateOfBirth.toISOString()
            : data.dateOfBirth,
      };
      const newPlayer = (await apiClient.createPlayer(formattedData)) as Player;
      set((state) => ({
        players: [...state.players, newPlayer],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to create player",
        isLoading: false,
      });
      throw error;
    }
  },

  updatePlayer: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      // Convert dateOfBirth from Date to ISO string if it's a Date object
      const formattedData = {
        ...data,
        ...(data.dateOfBirth && {
          dateOfBirth:
            data.dateOfBirth instanceof Date
              ? data.dateOfBirth.toISOString()
              : data.dateOfBirth,
        }),
      };
      const updatedPlayer = (await apiClient.updatePlayer(
        id,
        formattedData
      )) as Player;
      set((state) => ({
        players: state.players.map((p) => (p.id === id ? updatedPlayer : p)),
        selectedPlayer:
          state.selectedPlayer?.id === id
            ? {
                ...updatedPlayer,
                testResults: state.selectedPlayer.testResults,
              }
            : state.selectedPlayer,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update player",
        isLoading: false,
      });
      throw error;
    }
  },

  deletePlayer: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deletePlayer(id);
      set((state) => ({
        players: state.players.filter((p) => p.id !== id),
        selectedPlayer:
          state.selectedPlayer?.id === id ? null : state.selectedPlayer,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete player",
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedPlayer: () => set({ selectedPlayer: null }),
}));
