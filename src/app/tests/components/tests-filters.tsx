import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import React from "react";
import { TestsFilters } from "../types";
import { getAvailableTestTypes } from "../utils/test-type.utils";

interface TestsFiltersSectionProps {
  filters: TestsFilters;
  setFilters: React.Dispatch<React.SetStateAction<TestsFilters>>;
}

const TestsFiltersSection = ({
  filters,
  setFilters,
}: TestsFiltersSectionProps) => {
  const testTypes = getAvailableTestTypes();

  const isFilterActive = (playingTime: number, recoveryTime: number) => {
    return (
      filters.playingTime === playingTime &&
      filters.recoveryTime === recoveryTime
    );
  };

  const handleFilterClick = (playingTime?: number, recoveryTime?: number) => {
    setFilters((prev) => ({
      ...prev,
      playingTime,
      recoveryTime,
      page: 1,
    }));
  };

  return (
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
            variant={
              !filters.playingTime && !filters.recoveryTime
                ? "default"
                : "outline"
            }
            size="sm"
            onClick={() => handleFilterClick()}
          >
            All Tests
          </Button>
          {testTypes.map(({ type, config }) => (
            <Button
              key={type}
              variant={
                isFilterActive(config.playingTime, config.recoveryTime)
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() =>
                handleFilterClick(config.playingTime, config.recoveryTime)
              }
            >
              {config.label} ({config.playingTime}s/{config.recoveryTime}s)
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestsFiltersSection;
