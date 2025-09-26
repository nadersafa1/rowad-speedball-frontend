import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { formatDate, getTestTypeLabel } from "@/lib/utils";
import { Test } from "@/types";
import { getTestTypeConfigFromTest } from "../utils/test-type.utils";
import Link from "next/link";

interface TestCardProps {
  test: Test;
}

const TestCard = ({ test }: TestCardProps) => {
  const testConfig = getTestTypeConfigFromTest(test);

  return (
    <Link href={`/tests/${test.id}`}>
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
              className={`px-2 py-1 rounded-md text-xs font-medium border ${testConfig.color}`}
            >
              {testConfig.label}
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
                <span>{testConfig.label}</span>
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
  );
};

export default TestCard;
