"use client";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTestsStore } from "@/store/tests-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Trophy } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TestDatePicker } from "./test-date-picker.tsx";

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
    .min(1, "Playing time must be at least 1 seconds")
    .max(300, "Playing time cannot exceed 300 seconds"),
  recoveryTime: z
    .number()
    .int("Recovery time must be an integer")
    .min(0, "Recovery time cannot be negative")
    .max(300, "Recovery time cannot exceed 300 seconds"),
  dateConducted: z.date().refine((date) => {
    const testDate = new Date(date);
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);
    return testDate >= oneYearAgo && testDate <= oneYearFromNow;
  }, "Test date must be within the last year or the next year"),
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
      dateConducted: test?.dateConducted
        ? new Date(test?.dateConducted?.split("T")[0])
        : new Date(),
      description: test?.description || "",
    },
  });

  const playingTime = form.watch("playingTime");
  const recoveryTime = form.watch("recoveryTime");

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
    <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto space-y-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-blue-600" />
          {isEditing ? "Edit Test" : "Create New Test"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update test information for Rowad speedball team"
            : "Set up a new speedball test for Rowad team"}
        </DialogDescription>
      </DialogHeader>
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
                  variant={
                    playingTime === 60 && recoveryTime === 30
                      ? "default"
                      : "outline"
                  }
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
                  variant={
                    playingTime === 30 && recoveryTime === 30
                      ? "default"
                      : "outline"
                  }
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
                  variant={
                    playingTime === 30 && recoveryTime === 60
                      ? "default"
                      : "outline"
                  }
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
                  <FormLabel>Test Day</FormLabel>
                  <FormControl>
                    <TestDatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      disabled={isLoading}
                    />
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

            <DialogFooter className="flex gap-3 mt-4">
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
            </DialogFooter>
          </form>
        </Form>
    </DialogContent>
  );
};

export default TestForm;
