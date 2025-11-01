"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Save } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePlayersStore } from "@/store/players-store";
import { DateOfBirthPicker } from "@/components/players/date-of-birth-picker";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui";

// Validation schema
const playerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  dateOfBirth: z
    .date()
    .refine(
      (date) => date <= new Date(new Date().getFullYear() - 4, 0, 1),
      "Player must be at least 4 years old"
    ),
  gender: z.enum(["male", "female"], {
    message: "Gender is required",
  }),
  preferredHand: z.enum(["left", "right"], {
    message: "Preferred hand is required",
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
      dateOfBirth: player
        ? new Date(player?.dateOfBirth?.split("T")[0])
        : new Date(new Date().getFullYear() - 4, 0, 1),
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
    <DialogContent className="max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto space-y-4">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">          <UserPlus className="h-5 w-5 text-rowad-600" />
{isEditing ? "Edit Player" : "Add New Player"}</DialogTitle>
      <DialogDescription>{isEditing ? "Update player information for Rowad speedball team" : "Register a new player for Rowad speedball team"}</DialogDescription>
    </DialogHeader>
    <Form {...form} >
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" >
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
                    <DateOfBirthPicker
                      date={field.value}
                      onDateChange={field.onChange}
                    />
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
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                      className="flex flex-col gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="gender-male" />
                        <label
                          htmlFor="gender-male"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Male
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="gender-female" />
                        <label
                          htmlFor="gender-female"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Female
                        </label>
                      </div>
                    </RadioGroup>
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
                  <FormControl >
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                      className="flex flex-col gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="left" id="hand-left" />
                        <label
                          htmlFor="hand-left"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Left Handed
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="right" id="hand-right" />
                        <label
                          htmlFor="hand-right"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Right Handed
                        </label>
                      </div>
                    </RadioGroup>
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
            </DialogFooter>

      
          </form>
        </Form>
   

    </DialogContent>
   
  );
};

export default PlayerForm;
