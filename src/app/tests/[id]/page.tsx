"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Filter,
  Clock,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTestsStore } from "@/store/tests-store";
import { useAdminPermission } from "@/hooks/use-admin-permission";
import { toast } from "sonner";
import ResultsForm from "@/components/results/results-form";
import TestForm from "@/components/tests/test-form";

const TestDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  const { isAdmin } = useAdminPermission();
  const { selectedTest, fetchTest, isLoading, deleteTest } = useTestsStore();
  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [editTestFormOpen, setEditTestFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    ageGroup: "",
    gender: "",
    yearOfBirth: "",
  });

  useEffect(() => {
    if (testId) {
      fetchTest(testId, true); // Include results
    }
  }, [testId, fetchTest]);

  if (isLoading || !selectedTest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getTestTypeLabel = (playingTime: number, recoveryTime: number) => {
    if (playingTime === 60 && recoveryTime === 30)
      return "Super Solo (60s/30s)";
    if (playingTime === 30 && recoveryTime === 30)
      return "Juniors Solo (30s/30s)";
    if (playingTime === 30 && recoveryTime === 60)
      return "Speed Solo (30s/60s)";
    return `Custom (${playingTime}s/${recoveryTime}s)`;
  };

  const getTestTypeColor = (playingTime: number, recoveryTime: number) => {
    if (playingTime === 60 && recoveryTime === 30)
      return "bg-red-100 text-red-800";
    if (playingTime === 30 && recoveryTime === 30)
      return "bg-blue-100 text-blue-800";
    if (playingTime === 30 && recoveryTime === 60)
      return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  // Filter results based on selected filters
  const filteredResults =
    selectedTest.testResults?.filter((result) => {
      if (filters.ageGroup && result.player?.ageGroup !== filters.ageGroup)
        return false;
      if (filters.gender && result.player?.gender !== filters.gender)
        return false;
      if (
        filters.yearOfBirth &&
        result.player?.dateOfBirth &&
        new Date(result.player.dateOfBirth).getFullYear().toString() !==
          filters.yearOfBirth
      )
        return false;
      return true;
    }) || [];

  // Group results by different criteria
  const groupBy = (results: any[], key: string): Record<string, any[]> => {
    return results.reduce((groups, result) => {
      const groupKey = result.player?.[key] || "Unknown";
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(result);
      return groups;
    }, {} as Record<string, any[]>);
  };

  const resultsByAgeGroup = groupBy(filteredResults, "ageGroup");
  const resultsByGender = groupBy(filteredResults, "gender");

  // Get unique values for filters
  const allResults = selectedTest.testResults || [];
  const uniqueAgeGroups = Array.from(
    new Set(allResults.map((r) => r.player?.ageGroup).filter(Boolean))
  );
  const uniqueGenders = Array.from(
    new Set(allResults.map((r) => r.player?.gender).filter(Boolean))
  );
  const uniqueYears = Array.from(
    new Set(
      allResults
        .map((r) =>
          r.player?.dateOfBirth
            ? new Date(r.player.dateOfBirth).getFullYear().toString()
            : null
        )
        .filter((year): year is string => Boolean(year))
    )
  ).sort();

  const handleDelete = async () => {
    try {
      await deleteTest(testId);
      toast.success("Test deleted successfully");
      router.push("/tests");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete test"
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/tests">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Button>
        </Link>
      </div>

      {/* Test Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="bg-blue-100 rounded-full p-3 sm:p-4 shrink-0">
                <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
              </div>
              <div className="flex-1 w-full min-w-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                      {selectedTest.name}
                    </h1>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getTestTypeColor(
                        selectedTest.playingTime,
                        selectedTest.recoveryTime
                      )}`}
                    >
                      {getTestTypeLabel(
                        selectedTest.playingTime,
                        selectedTest.recoveryTime
                      )}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Dialog
                        open={editTestFormOpen}
                        onOpenChange={setEditTestFormOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2 w-full sm:w-auto">
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit Test</span>
                            <span className="sm:hidden">Edit</span>
                          </Button>
                        </DialogTrigger>
                        <TestForm
                          test={selectedTest}
                          onSuccess={() => {
                            setEditTestFormOpen(false);
                            fetchTest(testId, true);
                          }}
                          onCancel={() => setEditTestFormOpen(false)}
                        />
                      </Dialog>
                      <AlertDialog
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="gap-2 text-destructive hover:text-destructive w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete Test</span>
                            <span className="sm:hidden">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Test</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>{selectedTest.name}</strong>? This action
                              cannot be undone and will permanently delete all
                              associated test results.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={handleDelete}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Date:{" "}
                      {new Date(
                        selectedTest.dateConducted
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Participants: {allResults.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Test Type:{" "}
                      {getTestTypeLabel(
                        selectedTest.playingTime,
                        selectedTest.recoveryTime
                      )}
                    </span>
                  </div>
                </div>
                {selectedTest.description && (
                  <p className="text-gray-600">{selectedTest.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Group
              </label>
              <select
                value={filters.ageGroup}
                onChange={(e) =>
                  setFilters({ ...filters, ageGroup: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Age Groups</option>
                {uniqueAgeGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={filters.gender}
                onChange={(e) =>
                  setFilters({ ...filters, gender: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Genders</option>
                {uniqueGenders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender === "male" ? "Male" : "Female"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birth Year
              </label>
              <select
                value={filters.yearOfBirth}
                onChange={(e) =>
                  setFilters({ ...filters, yearOfBirth: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All Years</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(filters.ageGroup || filters.gender || filters.yearOfBirth) && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ ageGroup: "", gender: "", yearOfBirth: "" })
                }
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      <div className="space-y-8">
        {/* All Results */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <CardTitle>
                  Test Results ({filteredResults.length} participants)
                </CardTitle>
                <CardDescription>
                  Individual results sorted by total score
                </CardDescription>
              </div>

              {/* Admin Add Result Button */}
              {isAdmin && (
                <Dialog open={resultFormOpen} onOpenChange={setResultFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                      <Plus className="h-4 w-4" />
                      Add Result
                    </Button>
                  </DialogTrigger>
                  <ResultsForm
                    preselectedTestId={testId}
                    onSuccess={() => {
                      setResultFormOpen(false);
                      fetchTest(testId, true);
                    }}
                    onCancel={() => setResultFormOpen(false)}
                  />
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredResults.length > 0 ? (
              <div className="space-y-4">
                {filteredResults
                  .sort((a, b) => {
                    const totalA =
                      a.leftHandScore +
                      a.rightHandScore +
                      a.forehandScore +
                      a.backhandScore;
                    const totalB =
                      b.leftHandScore +
                      b.rightHandScore +
                      b.forehandScore +
                      b.backhandScore;
                    return totalB - totalA;
                  })
                  .map((result, index) => {
                    const totalScore =
                      result.leftHandScore +
                      result.rightHandScore +
                      result.forehandScore +
                      result.backhandScore;
                    return (
                      <div
                        key={result.id}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <span className="text-base sm:text-lg font-bold text-gray-500">
                                #{index + 1}
                              </span>
                              <Link
                                href={`/players/${result.player?.id}`}
                                className="text-base sm:text-lg font-semibold text-rowad-600 hover:text-rowad-700 break-words"
                              >
                                {result.player?.name}
                              </Link>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              {result.player?.gender === "male" ? "👨" : "👩"}{" "}
                              {result.player?.ageGroup} • Age{" "}
                              {result.player?.age}
                            </p>
                          </div>
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-xl sm:text-2xl font-bold text-blue-600">
                              {totalScore}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">Total Score</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <p className="font-medium text-lg">
                              {result.leftHandScore}
                            </p>
                            <p className="text-gray-600">Left Hand</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-lg">
                              {result.rightHandScore}
                            </p>
                            <p className="text-gray-600">Right Hand</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-lg">
                              {result.forehandScore}
                            </p>
                            <p className="text-gray-600">Forehand</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-lg">
                              {result.backhandScore}
                            </p>
                            <p className="text-gray-600">Backhand</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Results Found
                </h3>
                <p className="text-gray-600">
                  No participants match the current filters.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grouped by Age Group */}
        {Object.keys(resultsByAgeGroup).length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Results by Age Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(resultsByAgeGroup).map(
                  ([ageGroup, results]) => (
                    <div key={ageGroup}>
                      <h3 className="text-lg font-semibold mb-3 text-rowad-600">
                        {ageGroup} ({results.length} participants)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results
                          .sort((a, b) => {
                            const totalA =
                              a.leftHandScore +
                              a.rightHandScore +
                              a.forehandScore +
                              a.backhandScore;
                            const totalB =
                              b.leftHandScore +
                              b.rightHandScore +
                              b.forehandScore +
                              b.backhandScore;
                            return totalB - totalA;
                          })
                          .map((result, index) => {
                            const totalScore =
                              result.leftHandScore +
                              result.rightHandScore +
                              result.forehandScore +
                              result.backhandScore;
                            return (
                              <div
                                key={result.id}
                                className="border rounded-lg p-3 bg-gray-50"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <Link
                                    href={`/players/${result.player?.id}`}
                                    className="font-medium text-rowad-600 hover:text-rowad-700"
                                  >
                                    {result.player?.name}
                                  </Link>
                                  <span className="font-bold text-blue-600">
                                    {totalScore}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  {result.player?.gender === "male"
                                    ? "👨"
                                    : "👩"}{" "}
                                  Age {result.player?.age}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestDetailPage;
