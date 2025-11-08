"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target, Save, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usePlayersStore } from "@/store/players-store";
import { useTestsStore } from "@/store/tests-store";
import { apiClient } from "@/lib/api-client";

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
  const { players, fetchPlayers } = usePlayersStore();
  const { tests, fetchTests } = useTestsStore();
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

  // Only fetch if data is completely empty (first time load)
  useEffect(() => {
    if (players.length === 0 && tests.length === 0) {
      // Both stores are empty, likely first load
      fetchPlayers();
      fetchTests();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: ResultFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await apiClient.updateResult(result.id, data);
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
  const playerId = form.watch("playerId");
  const testId = form.watch("testId");

  const totalScore =
    leftHandScore + rightHandScore + forehandScore + backhandScore;

  // Memoize selections to prevent unnecessary re-renders
  const selectedPlayer = useCallback(() => {
    return players.find((p) => p.id === playerId);
  }, [players, playerId])();

  const selectedTest = useCallback(() => {
    return tests.find((t) => t.id === testId);
  }, [tests, testId])();

  return (
    <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto space-y-4">
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || !!preselectedPlayerId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a player..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} (
                          {player.gender === "male" ? "👨" : "👩"}{" "}
                          {player.ageGroup})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedPlayer && (
                    <div className="text-sm text-gray-600 mt-1">
                      Age: {selectedPlayer.age} • Group:{" "}
                      {selectedPlayer.ageGroup}
                    </div>
                  )}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || !!preselectedTestId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a test..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.name} (
                          {test.playingTime === 60 && test.recoveryTime === 30
                            ? "Super Solo"
                            : test.playingTime === 30 &&
                              test.recoveryTime === 30
                            ? "Juniors Solo"
                            : "Speed Solo"}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {selectedTest && (
                    <div className="text-sm text-gray-600 mt-1">
                      Date:{" "}
                      {new Date(
                        selectedTest.dateConducted
                      ).toLocaleDateString()}{" "}
                      • Type:{" "}
                      {selectedTest.playingTime === 60 &&
                      selectedTest.recoveryTime === 30
                        ? "Super Solo (60s/30s)"
                        : selectedTest.playingTime === 30 &&
                          selectedTest.recoveryTime === 30
                        ? "Juniors Solo (30s/30s)"
                        : "Speed Solo (30s/60s)"}
                    </div>
                  )}
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
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isLoading}
                        className="text-center"
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
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isLoading}
                        className="text-center"
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
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isLoading}
                        className="text-center"
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
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max="100"
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                        disabled={isLoading}
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Total Score Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">
                  Total Score:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {totalScore}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
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
