import { useTestsStore } from "@/store/tests-store";
import { TestsFilters } from "../types";
import { useEffect, useCallback } from "react";

export const useTests = (filters: TestsFilters) => {
  const { tests, isLoading, error, pagination, fetchTests, clearError } =
    useTestsStore();

  // Fetch tests when filters change
  useEffect(() => {
    fetchTests(filters);
  }, [filters, fetchTests]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchTests({ ...filters, page });
    },
    [filters, fetchTests]
  );

  const refetch = useCallback(() => {
    fetchTests(filters);
  }, [filters, fetchTests]);

  return {
    tests,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  };
};
