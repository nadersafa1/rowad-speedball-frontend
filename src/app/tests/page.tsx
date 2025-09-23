"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, Filter, Clock, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useTestsStore } from "@/store/tests-store";
import { useAuthStore } from "@/store/auth-store";
import { formatDate, getTestTypeLabel } from "@/lib/utils";
import TestForm from "@/components/tests/test-form";
import Pagination from "@/components/ui/pagination";

const TestsPage = () => {
  const { user } = useAuthStore();
  const { tests, isLoading, error, pagination, fetchTests, clearError } =
    useTestsStore();

  const [testFormOpen, setTestFormOpen] = useState(false);

  // Local filter state
  const [filters, setFilters] = useState({
    testType: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
  });

  // Initial fetch
  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Fetch when filters change
  useEffect(() => {
    fetchTests(filters);
  }, [filters, fetchTests]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getTestTypeColor = (testType: string) => {
    switch (testType) {
      case "60_30":
        return "bg-red-100 text-red-800 border-red-200";
      case "30_30":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "30_60":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-speedball-600" />
            Tests Archive
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse and manage all conducted speedball tests
          </p>
        </div>

        {/* Admin Add Test Button */}
        {user && (
          <Dialog open={testFormOpen} onOpenChange={setTestFormOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <TestForm
                onSuccess={() => {
                  setTestFormOpen(false);
                  fetchTests();
                }}
                onCancel={() => setTestFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Test Type Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Test Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filters.testType === "" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((prev) => ({ ...prev, testType: "", page: 1 }))
              }
            >
              All Tests
            </Button>
            <Button
              variant={filters.testType === "60_30" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((prev) => ({ ...prev, testType: "60_30", page: 1 }))
              }
            >
              Super Solo (60s/30s)
            </Button>
            <Button
              variant={filters.testType === "30_30" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((prev) => ({ ...prev, testType: "30_30", page: 1 }))
              }
            >
              Juniors Solo (30s/30s)
            </Button>
            <Button
              variant={filters.testType === "30_60" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((prev) => ({ ...prev, testType: "30_60", page: 1 }))
              }
            >
              Speed Solo (30s/60s)
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tests found</h3>
            <p className="text-muted-foreground">
              {filters.testType
                ? "No tests found for the selected type."
                : "No tests have been conducted yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Link key={test.id} href={`/tests/${test.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">
                        {test.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(test.dateConducted)}
                      </CardDescription>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-md text-xs font-medium border ${getTestTypeColor(
                        test.testType
                      )}`}
                    >
                      {getTestTypeLabel(test.testType)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {test.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {test.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{getTestTypeLabel(test.testType)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button size="sm" variant="outline" className="w-full">
                        View Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Test Types Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm font-medium mb-2 inline-block">
                Super Solo
              </div>
              <h4 className="font-semibold">60s Play / 30s Rest</h4>
              <p className="text-sm text-muted-foreground mt-1">
                High-intensity endurance test with extended play time
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm font-medium mb-2 inline-block">
                Juniors Solo
              </div>
              <h4 className="font-semibold">30s Play / 30s Rest</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Balanced intensity test with equal play and rest periods
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium mb-2 inline-block">
                Speed Solo
              </div>
              <h4 className="font-semibold">30s Play / 60s Rest</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Recovery-focused test with extended rest periods
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {tests.length > 0 && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{pagination.totalItems}</p>
                <p className="text-muted-foreground text-sm">Total Tests</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tests.filter((t) => t.testType === "60_30").length}
                </p>
                <p className="text-muted-foreground text-sm">
                  Super Solo (Current Page)
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tests.filter((t) => t.testType === "30_30").length}
                </p>
                <p className="text-muted-foreground text-sm">
                  Juniors Solo (Current Page)
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tests.filter((t) => t.testType === "30_60").length}
                </p>
                <p className="text-muted-foreground text-sm">
                  Speed Solo (Current Page)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestsPage;
