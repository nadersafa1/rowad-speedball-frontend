"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Trophy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTestsStore } from "@/store/tests-store";

// Validation schema
const testSchema = z.object({
  name: z
    .string()
    .min(1, "Test name is required")
    .min(3, "Test name must be at least 3 characters")
    .max(200, "Test name must be less than 200 characters"),
  playingTime: z
    .number()
    .int("Playing time must be an integer")
    .min(1, "Playing time must be at least 1 minute")
    .max(300, "Playing time cannot exceed 300 minutes"),
  recoveryTime: z
    .number()
    .int("Recovery time must be an integer")
    .min(0, "Recovery time cannot be negative")
    .max(300, "Recovery time cannot exceed 300 minutes"),
  dateConducted: z
    .string()
    .min(1, "Date is required")
    .refine((date) => {
      const testDate = new Date(date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return testDate >= oneYearAgo && testDate <= today;
    }, "Test date must be within the last year and not in the future"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type TestFormData = z.infer<typeof testSchema>;

interface TestFormProps {
  test?: any; // For editing existing tests
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TestForm = ({ test, onSuccess, onCancel }: TestFormProps) => {
  const { createTest, updateTest, isLoading, error, clearError } =
    useTestsStore();
  const isEditing = !!test;

  const form = useForm<TestFormData>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: test?.name || "",
      playingTime: test?.playingTime || 30,
      recoveryTime: test?.recoveryTime || 30,
      dateConducted: test?.dateConducted?.split("T")[0] || "",
      description: test?.description || "",
    },
  });

  const onSubmit = async (data: TestFormData) => {
    clearError();
    try {
      if (isEditing) {
        await updateTest(test.id, data);
      } else {
        await createTest(data);
      }
      form.reset();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-600" />
          {isEditing ? "Edit Test" : "Create New Test"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update test information for Rowad speedball team"
            : "Set up a new speedball test for Rowad team"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Test Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter test name (e.g., 'Spring Championship 2024')"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Playing Time Field */}
            <FormField
              control={form.control}
              name="playingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playing Time (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      max="300"
                      placeholder="Enter playing time in seconds"
                      disabled={isLoading}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recovery Time Field */}
            <FormField
              control={form.control}
              name="recoveryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recovery Time (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      max="300"
                      placeholder="Enter recovery time in seconds"
                      disabled={isLoading}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quick Presets */}
            <div className="space-y-2">
              <FormLabel>Quick Presets</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue("playingTime", 60);
                    form.setValue("recoveryTime", 30);
                  }}
                  disabled={isLoading}
                >
                  Super Solo (60s/30s)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue("playingTime", 30);
                    form.setValue("recoveryTime", 30);
                  }}
                  disabled={isLoading}
                >
                  Juniors Solo (30s/30s)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue("playingTime", 30);
                    form.setValue("recoveryTime", 60);
                  }}
                  disabled={isLoading}
                >
                  Speed Solo (30s/60s)
                </Button>
              </div>
            </div>

            {/* Date Conducted Field */}
            <FormField
              control={form.control}
              name="dateConducted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Conducted</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type="date"
                        disabled={isLoading}
                        className="pl-10"
                        max={new Date().toISOString().split("T")[0]}
                      />
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="Add any additional details about this test..."
                      disabled={isLoading}
                      className="w-full p-3 border border-gray-300 rounded-md resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? "Updating..." : "Creating..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Test" : "Create Test"}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TestForm;
