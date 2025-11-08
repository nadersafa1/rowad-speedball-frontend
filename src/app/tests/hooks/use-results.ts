import { useResultsStore } from "@/store/results-store";
import { useEffect, useCallback } from "react";

interface ResultsFilters {
  testId: string;
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

export const useResults = (filters: ResultsFilters) => {
  const { results, isLoading, error, pagination, fetchResults, clearError } =
    useResultsStore();

  // Fetch results when filters change (matching players pattern)
  useEffect(() => {
    fetchResults(filters);
  }, [filters, fetchResults]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchResults({ ...filters, page });
    },
    [filters, fetchResults]
  );

  const refetch = useCallback(() => {
    fetchResults(filters);
  }, [filters, fetchResults]);

  return {
    results,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  };
};

