// Results Store - Single responsibility: Results state management
import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import type { TestResult, PaginatedResponse } from "@/types";

interface ResultsFilters {
  testId: string; // Required
  q?: string;
  gender?: "male" | "female" | "all";
  ageGroup?: string;
  yearOfBirth?: number;
  sortBy?:
    | "totalScore"
    | "leftHandScore"
    | "rightHandScore"
    | "forehandScore"
    | "backhandScore"
    | "playerName"
    | "ageGroup"
    | "age"
    | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ResultWithPlayer {
  id: string;
  playerId: string;
  testId: string;
  leftHandScore: number;
  rightHandScore: number;
  forehandScore: number;
  backhandScore: number;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
  player?: {
    id: string;
    name: string;
    dateOfBirth: string;
    gender: "male" | "female";
    age?: number;
    ageGroup?: string;
  } | null;
  test?: {
    id: string;
    name: string;
  } | null;
}

interface ResultsState {
  results: ResultWithPlayer[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };

  // Actions
  fetchResults: (filters: ResultsFilters) => Promise<void>;
  deleteResult: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  results: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 0,
  },

  fetchResults: async (filters) => {
    set({ isLoading: true, error: null });

    try {
      const params = {
        testId: filters.testId,
        q: filters.q,
        gender: filters.gender,
        ageGroup: filters.ageGroup,
        yearOfBirth: filters.yearOfBirth?.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page || 1,
        limit: filters.limit || 25,
      };

      const response = await apiClient.getResults(params);

      set({
        results: response.data,
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
          error instanceof Error ? error.message : "Failed to fetch results",
        isLoading: false,
      });
    }
  },

  deleteResult: async (id: string) => {
    try {
      await apiClient.deleteResult(id);
      set((state) => ({
        results: state.results.filter((r) => r.id !== id),
      }));
    } catch (error) {
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

