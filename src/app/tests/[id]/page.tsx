"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useTestsStore } from "@/store/tests-store";
import { useAuthStore } from "@/store/auth-store";
import ResultsForm from "@/components/results/results-form";
import TestForm from "@/components/tests/test-form";

const TestDetailPage = () => {
  const params = useParams();
  const testId = params.id as string;
  const { user } = useAuthStore();
  const { selectedTest, fetchTest, isLoading } = useTestsStore();
  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [editTestFormOpen, setEditTestFormOpen] = useState(false);
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

  const getTestTypeLabel = (testType: string) => {
    switch (testType) {
      case "60_30":
        return "Super Solo (60s/30s)";
      case "30_30":
        return "Juniors Solo (30s/30s)";
      case "30_60":
        return "Speed Solo (30s/60s)";
      default:
        return testType;
    }
  };

  const getTestTypeColor = (testType: string) => {
    switch (testType) {
      case "60_30":
        return "bg-red-100 text-red-800";
      case "30_30":
        return "bg-blue-100 text-blue-800";
      case "30_60":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
            <div className="flex items-start gap-6">
              <div className="bg-blue-100 rounded-full p-4">
                <Trophy className="h-12 w-12 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {selectedTest.name}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getTestTypeColor(
                        selectedTest.testType
                      )}`}
                    >
                      {getTestTypeLabel(selectedTest.testType)}
                    </span>
                  </div>
                  {user && (
                    <Dialog
                      open={editTestFormOpen}
                      onOpenChange={setEditTestFormOpen}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Edit className="h-4 w-4" />
                          Edit Test
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <TestForm
                          test={selectedTest}
                          onSuccess={() => {
                            setEditTestFormOpen(false);
                            fetchTest(testId, true);
                          }}
                          onCancel={() => setEditTestFormOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
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
                      Test Type: {getTestTypeLabel(selectedTest.testType)}
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  Test Results ({filteredResults.length} participants)
                </CardTitle>
                <CardDescription>
                  Individual results sorted by total score
                </CardDescription>
              </div>

              {/* Admin Add Result Button */}
              {user && (
                <Dialog open={resultFormOpen} onOpenChange={setResultFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4" />
                      Add Result
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <ResultsForm
                      preselectedTestId={testId}
                      onSuccess={() => {
                        setResultFormOpen(false);
                        fetchTest(testId, true);
                      }}
                      onCancel={() => setResultFormOpen(false)}
                    />
                  </DialogContent>
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
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-gray-500">
                                #{index + 1}
                              </span>
                              <Link
                                href={`/players/${result.player?.id}`}
                                className="text-lg font-semibold text-rowad-600 hover:text-rowad-700"
                              >
                                {result.player?.name}
                              </Link>
                            </div>
                            <p className="text-sm text-gray-600">
                              {result.player?.gender === "male" ? "👨" : "👩"}{" "}
                              {result.player?.ageGroup} • Age{" "}
                              {result.player?.age}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              {totalScore}
                            </p>
                            <p className="text-sm text-gray-600">Total Score</p>
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
