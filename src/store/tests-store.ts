// Tests Store - Single responsibility: Tests state management
import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import type { Test, TestWithResults, PaginatedResponse } from "@/types";

interface TestsState {
  tests: Test[];
  selectedTest: TestWithResults | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };

  // Actions
  fetchTests: (filters?: {
    q?: string;
    playingTime?: number;
    recoveryTime?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => Promise<void>;
  fetchTest: (id: string, includeResults?: boolean) => Promise<void>;
  createTest: (data: any) => Promise<void>;
  updateTest: (id: string, data: any) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  clearError: () => void;
  clearSelectedTest: () => void;
}

export const useTestsStore = create<TestsState>((set, get) => ({
  tests: [],
  selectedTest: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  },

  fetchTests: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = {
        q: filters.q || undefined,
        playingTime: filters.playingTime || undefined,
        recoveryTime: filters.recoveryTime || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: filters.page || 1,
        limit: filters.limit || 10,
      };

      const response = (await apiClient.getTests(
        params
      )) as PaginatedResponse<Test>;
      set({
        tests: response.data,
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
        error: error instanceof Error ? error.message : "Failed to fetch tests",
        isLoading: false,
      });
    }
  },

  fetchTest: async (id: string, includeResults = false) => {
    set({ isLoading: true, error: null });
    try {
      const test = (await apiClient.getTest(
        id,
        includeResults
      )) as TestWithResults;
      set({ selectedTest: test, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch test",
        isLoading: false,
      });
    }
  },

  createTest: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const newTest = (await apiClient.createTest(data)) as Test;
      set((state) => ({
        tests: [...state.tests, newTest],
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create test",
        isLoading: false,
      });
      throw error;
    }
  },

  updateTest: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTest = (await apiClient.updateTest(id, data)) as Test;
      set((state) => ({
        tests: state.tests.map((t) => (t.id === id ? updatedTest : t)),
        selectedTest:
          state.selectedTest?.id === id
            ? {
                ...updatedTest,
                testResults: state.selectedTest.testResults,
              }
            : state.selectedTest,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update test",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteTest: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.deleteTest(id);
      set((state) => ({
        tests: state.tests.filter((t) => t.id !== id),
        selectedTest: state.selectedTest?.id === id ? null : state.selectedTest,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete test",
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearSelectedTest: () => set({ selectedTest: null }),
}));
