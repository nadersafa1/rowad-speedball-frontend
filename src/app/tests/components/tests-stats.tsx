import { Card, CardContent } from "@/components/ui/card";
import { Test } from "@/types";
import { countTestsByType } from "../utils/test-type.utils";
import React from "react";

interface TestsStatsProps {
  tests: Test[];
  pagination: {
    totalItems: number;
  };
}

const TestsStats = ({ tests, pagination }: TestsStatsProps) => {
  if (tests.length === 0) return null;

  return (
    <Card className="mt-8">
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{pagination.totalItems}</p>
            <p className="text-muted-foreground text-sm">Total Tests</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {countTestsByType(tests, 60, 30)}
            </p>
            <p className="text-muted-foreground text-sm">
              Super Solo (Current Page)
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {countTestsByType(tests, 30, 30)}
            </p>
            <p className="text-muted-foreground text-sm">
              Juniors Solo (Current Page)
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {countTestsByType(tests, 30, 60)}
            </p>
            <p className="text-muted-foreground text-sm">
              Speed Solo (Current Page)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestsStats;
