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
import { Checkbox } from "@/components/ui/checkbox";
import { usePlayersStore } from "@/store/players-store";
import { DateOfBirthPicker } from "@/components/players/date-of-birth-picker";
import { parseDateFromAPI } from "@/lib/date-utils";
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
      (date) => date <= new Date(new Date().getFullYear() - 2, 0, 1),
      "Player must be at least 2 years old"
    ),
  gender: z.enum(["male", "female"], {
    message: "Gender is required",
  }),
  preferredHand: z.enum(["left", "right"], {
    message: "Preferred hand is required",
  }),
  isFirstTeam: z.boolean().default(false),
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
      dateOfBirth: player?.dateOfBirth
        ? parseDateFromAPI(player.dateOfBirth)
        : new Date(new Date().getFullYear() - 2, 0, 1),
      gender: player?.gender || undefined,
      preferredHand: player?.preferredHand || undefined,
      isFirstTeam: player?.isFirstTeam || false,
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
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">          <UserPlus className="h-5 w-5 text-rowad-600" />
{isEditing ? "Edit Player" : "Add New Player"}</DialogTitle>
      <DialogDescription className="text-sm">{isEditing ? "Update player information for Rowad speedball team" : "Register a new player for Rowad speedball team"}</DialogDescription>
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
                      className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-2"
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
                      className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-2"
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

            {/* First Team Field */}
            <FormField
              control={form.control}
              name="isFirstTeam"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">
                    First Team
                  </FormLabel>
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
             <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="w-full sm:w-auto min-w-[44px] min-h-[44px]"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[44px] min-h-[44px] bg-rowad-600 hover:bg-rowad-700"
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
