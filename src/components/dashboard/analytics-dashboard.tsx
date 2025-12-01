"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Calendar,
  Filter,
  ChevronDown,
  TestTube,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import { usePlayersStore } from "@/store/players-store";
import { useTestsStore } from "@/store/tests-store";
import { getTestTypeLabel } from "@/lib/utils";
import type { Test, Player } from "@/types";

// Color schemes for charts
const COLORS = {
  primary: "#22c55e", // rowad-500
  secondary: "#3b82f6", // blue-500
  accent: "#f59e0b", // amber-500
  danger: "#ef4444", // red-500
  purple: "#8b5cf6", // violet-500
  pink: "#ec4899", // pink-500
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.danger,
  COLORS.purple,
  COLORS.pink,
];

const RichDashboard = () => {
  const {
    players,
    fetchPlayers,
    isLoading: playersLoading,
  } = usePlayersStore();
  const { tests, fetchTests, isLoading: testsLoading } = useTestsStore();

  // Filter states
  const [selectedTestType, setSelectedTestType] = useState<string>("all");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([
    "Mini",
    "U-09",
    "U-11",
    "U-13",
    "U-15",
    "U-17",
    "U-19",
    "U-21",
    "Seniors",
  ]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([
    "male",
    "female",
  ]);

  useEffect(() => {
    fetchPlayers();
    fetchTests();
  }, [fetchPlayers, fetchTests]);

  // Clear selected tests when test type changes
  useEffect(() => {
    setSelectedTests([]);
  }, [selectedTestType]);

  // Get filtered tests based on selected test type
  const filteredTests = useMemo(() => {
    if (selectedTestType === "all") return tests;
    return tests.filter((test) => {
      if (selectedTestType === "60_30")
        return test.playingTime === 60 && test.recoveryTime === 30;
      if (selectedTestType === "30_30")
        return test.playingTime === 30 && test.recoveryTime === 30;
      if (selectedTestType === "30_60")
        return test.playingTime === 30 && test.recoveryTime === 60;
      return false;
    });
  }, [tests, selectedTestType]);

  // Get available test results data
  const testResultsData = useMemo(() => {
    // This would ideally come from a dedicated API endpoint
    // For now, we'll simulate some test results data with realistic speedball scores
    const mockResults = tests.flatMap((test) =>
      players
        .slice(0, Math.floor(Math.random() * players.length))
        .map((player) => {
          // Generate realistic speedball scores based on age group
          const ageGroup = player.ageGroup;
          const baseScore =
            ageGroup === "Mini" ? 8 : ageGroup.includes("U-") ? 15 : 20;

          const leftHandScore = Math.floor(Math.random() * 15) + baseScore;
          const rightHandScore = Math.floor(Math.random() * 15) + baseScore;
          const forehandScore = Math.floor(Math.random() * 20) + baseScore + 5;
          const backhandScore = Math.floor(Math.random() * 20) + baseScore + 5;
          const totalScore =
            leftHandScore + rightHandScore + forehandScore + backhandScore;

          return {
            testId: test.id,
            testName: test.name,
            testType:
              test.playingTime === 60 && test.recoveryTime === 30
                ? "60_30"
                : test.playingTime === 30 && test.recoveryTime === 30
                ? "30_30"
                : test.playingTime === 30 && test.recoveryTime === 60
                ? "30_60"
                : "custom",
            testDate: test.dateConducted,
            playerId: player.id,
            playerName: player.name,
            playerGender: player.gender,
            playerAgeGroup: player.ageGroup,
            playerAgeCategory: player.ageGroup,
            leftHandScore,
            rightHandScore,
            forehandScore,
            backhandScore,
            totalScore,
          };
        })
    );
    return mockResults;
  }, [tests, players]);

  // Filter test results based on selections
  const filteredResults = useMemo(() => {
    return testResultsData.filter((result) => {
      const testTypeMatch =
        selectedTestType === "all" || result.testType === selectedTestType;
      const testMatch =
        selectedTests.length === 0 || selectedTests.includes(result.testId);
      const ageGroupMatch = selectedAgeGroups.includes(result.playerAgeGroup);
      const genderMatch = selectedGenders.includes(result.playerGender);
      return testTypeMatch && testMatch && ageGroupMatch && genderMatch;
    });
  }, [
    testResultsData,
    selectedTestType,
    selectedTests,
    selectedAgeGroups,
    selectedGenders,
  ]);

  // Analytics calculations
  const analytics = useMemo(() => {
    // Basic stats
    const totalPlayers = players.length;
    const totalTests = tests.length;
    const totalResults = filteredResults.length;

    // Gender distribution
    const genderDistribution = players.reduce((acc, player) => {
      acc[player.gender] = (acc[player.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Age group distribution for pie chart
    const ageGroupData = players.reduce((acc, player) => {
      const ageGroup = player.ageGroup;
      acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ageGroupPieData = Object.entries(ageGroupData).map(
      ([ageGroup, count]) => ({
        name: ageGroup,
        value: count,
      })
    );

    // Performance by age group (bar chart)
    const performanceByAge = selectedAgeGroups.map((ageGroup) => {
      const ageGroupResults = filteredResults.filter(
        (r) => r.playerAgeGroup === ageGroup
      );

      if (ageGroupResults.length === 0) {
        return {
          category: ageGroup,
          totalScore: 0,
          handBalance: 0,
          strokeBalance: 0,
          participants: 0,
        };
      }

      const avgScore =
        ageGroupResults.reduce((sum, r) => sum + r.totalScore, 0) /
        ageGroupResults.length;

      // Hand Balance: How balanced are left vs right hand scores (0-100, higher = more balanced)
      const avgHandBalance =
        ageGroupResults.reduce((sum, r) => {
          const leftRight =
            Math.min(r.leftHandScore, r.rightHandScore) /
            Math.max(r.leftHandScore, r.rightHandScore, 1);
          return sum + leftRight * 100;
        }, 0) / ageGroupResults.length;

      // Stroke Balance: How balanced are forehand vs backhand scores (0-100, higher = more balanced)
      const avgStrokeBalance =
        ageGroupResults.reduce((sum, r) => {
          const foreBack =
            Math.min(r.forehandScore, r.backhandScore) /
            Math.max(r.forehandScore, r.backhandScore, 1);
          return sum + foreBack * 100;
        }, 0) / ageGroupResults.length;

      return {
        category: ageGroup,
        totalScore: Math.round(avgScore),
        handBalance: Math.round(avgHandBalance),
        strokeBalance: Math.round(avgStrokeBalance),
        participants: ageGroupResults.length,
      };
    });

    // Performance trends over time (line chart)
    const performanceTrends = tests
      .sort(
        (a, b) =>
          new Date(a.dateConducted).getTime() -
          new Date(b.dateConducted).getTime()
      )
      .slice(-10) // Last 10 tests
      .map((test) => {
        const testResults = filteredResults.filter((r) => r.testId === test.id);
        const avgScore =
          testResults.length > 0
            ? testResults.reduce((sum, r) => sum + r.totalScore, 0) /
              testResults.length
            : 0;

        return {
          testName:
            test.name.length > 15
              ? test.name.substring(0, 15) + "..."
              : test.name,
          date: new Date(test.dateConducted).toLocaleDateString(),
          avgScore: Math.round(avgScore),
          participants: testResults.length,
        };
      });

    // Test type distribution
    const testTypeDistribution = tests.reduce((acc, test) => {
      const typeLabel = getTestTypeLabel(test.playingTime, test.recoveryTime);
      acc[typeLabel] = (acc[typeLabel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const testTypePieData = Object.entries(testTypeDistribution).map(
      ([type, count]) => ({
        name: type,
        value: count,
      })
    );

    // Top performers
    const topPerformers = filteredResults
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10)
      .map((result) => ({
        name: result.playerName,
        score: result.totalScore,
        testName: result.testName,
        ageGroup: result.playerAgeGroup,
        gender: result.playerGender,
      }));

    return {
      totalPlayers,
      totalTests,
      totalResults,
      genderDistribution,
      ageGroupPieData,
      performanceByAge,
      performanceTrends,
      testTypePieData,
      topPerformers,
    };
  }, [players, tests, filteredResults, selectedAgeGroups]);

  const isLoading = playersLoading || testsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-rowad-600" />
            Dashboard Filters
          </CardTitle>
          <CardDescription>
            Select specific tests and filter by age categories and gender to
            analyze performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Test Type Selection */}
            <Select
              value={selectedTestType}
              onValueChange={setSelectedTestType}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select test type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="60_30">Super Solo (60s/30s)</SelectItem>
                <SelectItem value="30_60">Speed Solo (30s/60s)</SelectItem>
                <SelectItem value="30_30">Juniors Solo (30s/30s)</SelectItem>
              </SelectContent>
            </Select>

            {/* Test Selection */}
            <Select
              value={selectedTests[0] || ""}
              onValueChange={(value) => setSelectedTests([value])}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                {filteredTests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Age Group Selection */}
            <Select
              value={selectedAgeGroups[0] || ""}
              onValueChange={(value) => setSelectedAgeGroups([value])}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mini">Mini (U-07)</SelectItem>
                <SelectItem value="U-09">U-09</SelectItem>
                <SelectItem value="U-11">U-11</SelectItem>
                <SelectItem value="U-13">U-13</SelectItem>
                <SelectItem value="U-15">U-15</SelectItem>
                <SelectItem value="U-17">U-17</SelectItem>
                <SelectItem value="U-19">U-19</SelectItem>
                <SelectItem value="U-21">U-21</SelectItem>
                <SelectItem value="Seniors">Seniors</SelectItem>
              </SelectContent>
            </Select>

            {/* Gender Selection */}
            <Select
              value={selectedGenders[0] || ""}
              onValueChange={(value) => setSelectedGenders([value])}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">👨 Male</SelectItem>
                <SelectItem value="female">👩 Female</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedTestType("all");
                setSelectedTests([]);
                setSelectedAgeGroups([
                  "Mini",
                  "U-09",
                  "U-11",
                  "U-13",
                  "U-15",
                  "U-17",
                  "U-19",
                  "U-21",
                  "Seniors",
                ]);
                setSelectedGenders(["male", "female"]);
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-rowad-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Players
                </p>
                <p className="text-3xl font-bold text-rowad-600">
                  {analytics.totalPlayers}
                </p>
              </div>
              <Users className="h-8 w-8 text-rowad-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tests
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.totalTests}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Filtered Results
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.totalResults}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Performance
                </p>
                <p className="text-3xl font-bold text-amber-600">
                  {analytics.totalResults > 0
                    ? Math.round(
                        analytics.performanceByAge.reduce(
                          (sum, p) => sum + p.totalScore,
                          0
                        ) / analytics.performanceByAge.length
                      )
                    : 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Age Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-rowad-600" />
              Performance by Age Group
            </CardTitle>
            <CardDescription>
              Total score, hand balance, and stroke balance across age groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.performanceByAge}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalScore"
                  fill={COLORS.primary}
                  name="Total Score"
                />
                <Bar
                  dataKey="handBalance"
                  fill={COLORS.secondary}
                  name="Hand Balance %"
                />
                <Bar
                  dataKey="strokeBalance"
                  fill={COLORS.accent}
                  name="Stroke Balance %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Age Group Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-rowad-600" />
              Player Age Group Distribution
            </CardTitle>
            <CardDescription>
              Distribution of players across specific age groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.ageGroupPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.ageGroupPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance Trends
            </CardTitle>
            <CardDescription>
              Average performance across recent tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="testName" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke={COLORS.secondary}
                  fill={COLORS.secondary}
                  fillOpacity={0.3}
                  name="Avg Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Test Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-600" />
              Test Type Distribution
            </CardTitle>
            <CardDescription>
              Distribution of different test types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.testTypePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.testTypePieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            Top Performers
          </CardTitle>
          <CardDescription>
            Highest scoring players in selected tests and filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.topPerformers.slice(0, 6).map((performer, index) => (
              <div
                key={`${performer.name}-${performer.testName}-${index}`}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0
                        ? "bg-yellow-500"
                        : index === 1
                        ? "bg-gray-400"
                        : index === 2
                        ? "bg-amber-600"
                        : "bg-rowad-500"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {performer.gender === "male" ? "👨" : "👩"}{" "}
                      {performer.ageGroup}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-rowad-600">
                    {performer.score}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {performer.testName.length > 20
                      ? performer.testName.substring(0, 20) + "..."
                      : performer.testName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RichDashboard;
