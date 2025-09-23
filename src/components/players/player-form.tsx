"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, UserPlus, Save } from "lucide-react";
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
import { usePlayersStore } from "@/store/players-store";

// Validation schema
const playerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 6 && age <= 50;
    }, "Player must be between 6 and 50 years old"),
  gender: z.enum(["male", "female"], {
    required_error: "Gender is required",
  }),
  preferredHand: z.enum(["left", "right"], {
    required_error: "Preferred hand is required",
  }),
});

type PlayerFormData = z.infer<typeof playerSchema>;

interface PlayerFormProps {
  player?: any; // For editing existing players
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PlayerForm = ({ player, onSuccess, onCancel }: PlayerFormProps) => {
  const { createPlayer, updatePlayer, isLoading, error, clearError } =
    usePlayersStore();
  const isEditing = !!player;

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player?.name || "",
      dateOfBirth: player?.dateOfBirth?.split("T")[0] || "",
      gender: player?.gender || undefined,
      preferredHand: player?.preferredHand || undefined,
    },
  });

  const onSubmit = async (data: PlayerFormData) => {
    clearError();
    try {
      if (isEditing) {
        await updatePlayer(player.id, data);
      } else {
        await createPlayer(data);
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
          <UserPlus className="h-5 w-5 text-rowad-600" />
          {isEditing ? "Edit Player" : "Add New Player"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update player information for Rowad speedball team"
            : "Register a new player for Rowad speedball team"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter player's full name"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth Field */}
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
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

            {/* Gender Field */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="male"
                          checked={field.value === "male"}
                          onChange={() => field.onChange("male")}
                          disabled={isLoading}
                          className="w-4 h-4 text-rowad-600 border-gray-300 focus:ring-rowad-500"
                        />
                        <span className="text-sm font-medium">Male</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="female"
                          checked={field.value === "female"}
                          onChange={() => field.onChange("female")}
                          disabled={isLoading}
                          className="w-4 h-4 text-rowad-600 border-gray-300 focus:ring-rowad-500"
                        />
                        <span className="text-sm font-medium">Female</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preferred Hand Field */}
            <FormField
              control={form.control}
              name="preferredHand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Hand</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="left"
                          checked={field.value === "left"}
                          onChange={() => field.onChange("left")}
                          disabled={isLoading}
                          className="w-4 h-4 text-rowad-600 border-gray-300 focus:ring-rowad-500"
                        />
                        <span className="text-sm font-medium">Left Handed</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="right"
                          checked={field.value === "right"}
                          onChange={() => field.onChange("right")}
                          disabled={isLoading}
                          className="w-4 h-4 text-rowad-600 border-gray-300 focus:ring-rowad-500"
                        />
                        <span className="text-sm font-medium">
                          Right Handed
                        </span>
                      </label>
                    </div>
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
                className="flex-1 bg-rowad-600 hover:bg-rowad-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditing ? "Updating..." : "Creating..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEditing ? "Update Player" : "Add Player"}
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

export default PlayerForm;
