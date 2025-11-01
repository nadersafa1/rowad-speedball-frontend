"use client";

import TestForm from "@/components/tests/test-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui";
import Pagination from "@/components/ui/pagination";
import { useAdminPermission } from "@/hooks/use-admin-permission";
import { Plus, Trophy } from "lucide-react";
import { useState } from "react";
import TestCard from "./components/test-card";
import TestTypeLegend from "./components/test-type-legend";
import TestsFiltersSection from "./components/tests-filters";
import TestsStats from "./components/tests-stats";
import { useTests } from "./hooks/use-tests";
import { TestsFilters } from "./types";

const TestsPage = () => {
  const { isAdmin } = useAdminPermission();
  const [testFormOpen, setTestFormOpen] = useState(false);

  // Local filter state
  const [filters, setFilters] = useState<TestsFilters>({
    q: "",
    playingTime: undefined,
    recoveryTime: undefined,
    dateFrom: "",
    dateTo: "",
    page: 1,
  });

  const {
    tests,
    isLoading,
    error,
    pagination,
    clearError,
    handlePageChange,
    refetch,
  } = useTests(filters);

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
        icon={Trophy}
        title="Tests Archive"
        description="Browse and manage all conducted speedball tests"
        actionDialog={
          isAdmin
            ? {
                open: testFormOpen,
                onOpenChange: setTestFormOpen,
                trigger: (
                  <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Add Test
                  </Button>
                ),
                content: (
                  <TestForm
                    onSuccess={() => {
                      setTestFormOpen(false);
                      refetch();
                    }}
                    onCancel={() => setTestFormOpen(false)}
                  />
                ),
              }
            : undefined
        }
      />

      {/* Filters */}
      <TestsFiltersSection filters={filters} setFilters={setFilters} />

      {/* Tests Grid */}
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
      ) : tests.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tests found"
          description={
            filters.playingTime || filters.recoveryTime
              ? "No tests found for the selected type."
              : "No tests have been conducted yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {tests.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Test Types Legend */}
      <TestTypeLegend />

      {/* Stats */}
      <TestsStats tests={tests} pagination={pagination} />
    </div>
  );
};

export default TestsPage;
