"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui";
import { apiClient } from "@/lib/api-client";
import PlayerCombobox from "@/components/players/player-combobox";
import TestCombobox from "@/components/tests/test-combobox";
import ScoreInput from "@/components/results/score-input";
import { DIALOG_CLASSES } from "@/lib/ui-constants";

// Validation schema
const resultSchema = z.object({
  playerId: z.string().min(1, "Player is required"),
  testId: z.string().min(1, "Test is required"),
  leftHandScore: z
    .number()
    .min(0, "Score must be 0 or higher")
    .max(999, "Score cannot exceed 999"),
  rightHandScore: z
    .number()
    .min(0, "Score must be 0 or higher")
    .max(999, "Score cannot exceed 999"),
  forehandScore: z
    .number()
    .min(0, "Score must be 0 or higher")
    .max(999, "Score cannot exceed 999"),
  backhandScore: z
    .number()
    .min(0, "Score must be 0 or higher")
    .max(999, "Score cannot exceed 999"),
});

type ResultFormData = z.infer<typeof resultSchema>;

interface ResultsFormProps {
  result?: any; // For editing existing results
  preselectedTestId?: string;
  preselectedPlayerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ResultsForm = ({
  result,
  preselectedTestId,
  preselectedPlayerId,
  onSuccess,
  onCancel,
}: ResultsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!result;

  const form = useForm<ResultFormData>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      playerId: result?.playerId || preselectedPlayerId || "",
      testId: result?.testId || preselectedTestId || "",
      leftHandScore: result?.leftHandScore || 0,
      rightHandScore: result?.rightHandScore || 0,
      forehandScore: result?.forehandScore || 0,
      backhandScore: result?.backhandScore || 0,
    },
  });

  const onSubmit = async (data: ResultFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Only send score fields when editing, exclude playerId and testId
        const { playerId, testId, ...scoreData } = data;
        await apiClient.updateResult(result.id, scoreData);
      } else {
        await apiClient.createResult(data);
      }
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      setError(error.message || "Failed to save test result");
    } finally {
      setIsLoading(false);
    }
  };

  // Use individual watches to minimize re-renders
  const leftHandScore = form.watch("leftHandScore") || 0;
  const rightHandScore = form.watch("rightHandScore") || 0;
  const forehandScore = form.watch("forehandScore") || 0;
  const backhandScore = form.watch("backhandScore") || 0;

  const totalScore =
    leftHandScore + rightHandScore + forehandScore + backhandScore;

  return (
    <DialogContent className={`${DIALOG_CLASSES.form} space-y-4`}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-600" />
          {isEditing ? "Edit Test Result" : "Add Test Result"}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update test result for Rowad speedball player"
            : "Record a new test result for Rowad speedball player"}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Player Selection */}
            <FormField
              control={form.control}
              name="playerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player</FormLabel>
                  <FormControl>
                    <PlayerCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading || !!preselectedPlayerId}
                      placeholder="Select a player..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Test Selection */}
            <FormField
              control={form.control}
              name="testId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test</FormLabel>
                  <FormControl>
                    <TestCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading || !!preselectedTestId}
                      placeholder="Select a test..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Score Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="leftHandScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Hand Score</FormLabel>
                    <FormControl>
                      <ScoreInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rightHandScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Hand Score</FormLabel>
                    <FormControl>
                      <ScoreInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="forehandScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forehand Score</FormLabel>
                    <FormControl>
                      <ScoreInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="backhandScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backhand Score</FormLabel>
                    <FormControl>
                      <ScoreInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Score Display */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-foreground">
                  Total Score:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {totalScore}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Individual scores: {leftHandScore} + {rightHandScore} +{" "}
                {forehandScore} + {backhandScore} = {totalScore}
              </div>
            </div>

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
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? "Updating..." : "Adding..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Result" : "Add Result"}
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
    </DialogContent>
  );
};

export default ResultsForm;
