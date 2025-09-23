// Players Store - Single responsibility: Players state management
import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';
import type { Player, PlayerWithResults } from '@/types';

interface PlayersState {
  players: Player[];
  selectedPlayer: PlayerWithResults | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPlayers: (filters?: { search?: string; gender?: string; ageGroup?: string }) => Promise<void>;
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

  fetchPlayers: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = {
        search: filters.search || undefined,
        gender: filters.gender as any || undefined,
        ageGroup: filters.ageGroup || undefined,
      };
      
      const players = await apiClient.getPlayers(params) as Player[];
      set({ players, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch players',
        isLoading: false 
      });
    }
  },

  fetchPlayer: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const player = await apiClient.getPlayer(id) as PlayerWithResults;
      set({ selectedPlayer: player, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch player',
        isLoading: false 
      });
    }
  },

  createPlayer: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const newPlayer = await apiClient.createPlayer(data) as Player;
      set(state => ({ 
        players: [...state.players, newPlayer],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create player',
        isLoading: false 
      });
      throw error;
    }
  },

  updatePlayer: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPlayer = await apiClient.updatePlayer(id, data) as Player;
      set(state => ({ 
        players: state.players.map(p => p.id === id ? updatedPlayer : p),
        selectedPlayer: state.selectedPlayer?.id === id ? { ...updatedPlayer, testResults: state.selectedPlayer.testResults } : state.selectedPlayer,
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update player',
        isLoading: false 
      });
      throw error;
    }
  },

  deletePlayer: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deletePlayer(id);
      set(state => ({ 
        players: state.players.filter(p => p.id !== id),
        selectedPlayer: state.selectedPlayer?.id === id ? null : state.selectedPlayer,
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete player',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedPlayer: () => set({ selectedPlayer: null }),
}));
