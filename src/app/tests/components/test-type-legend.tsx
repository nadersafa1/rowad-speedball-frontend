import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAvailableTestTypes } from "../utils/test-type.utils";
import React from "react";

const TestTypeLegend = () => {
  const testTypes = getAvailableTestTypes();

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Test Types Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testTypes.map(({ type, config }) => (
            <div key={type} className="text-center p-4 border rounded-lg">
              <div
                className={`${config.color} px-3 py-1 rounded-md text-sm font-medium mb-2 inline-block`}
              >
                {config.label}
              </div>
              <h4 className="font-semibold">
                {config.playingTime}s Play / {config.recoveryTime}s Rest
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestTypeLegend;
