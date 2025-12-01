'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePlayersStore } from '@/store/players-store'
import { Team } from '@/app/players/types/enums'
import { DateOfBirthPicker } from '@/components/players/date-of-birth-picker'
import { parseDateFromAPI } from '@/lib/date-utils'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'
import ClubCombobox from '@/components/organizations/club-combobox'
import { useOrganizationContext } from '@/hooks/use-organization-context'

// Validation schema
const playerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  nameRtl: z
    .string()
    .max(255, 'RTL Name must be less than 255 characters')
    .optional()
    .nullable(),
  dateOfBirth: z
    .date()
    .refine(
      (date) => date <= new Date(new Date().getFullYear() - 2, 0, 1),
      'Player must be at least 2 years old'
    ),
  gender: z.enum(['male', 'female'], {
    message: 'Gender is required',
  }),
  preferredHand: z.enum(['left', 'right'], {
    message: 'Preferred hand is required',
  }),
  team: z.enum(['first_team', 'rowad_b'], {
    message: 'Team is required',
  }),
  organizationId: z.string().uuid().nullable().optional(),
})

type PlayerFormData = z.infer<typeof playerSchema>

interface PlayerFormProps {
  player?: any // For editing existing players
  onSuccess?: () => void
  onCancel?: () => void
}

const PlayerForm = ({ player, onSuccess, onCancel }: PlayerFormProps) => {
  const { createPlayer, updatePlayer, error, clearError } = usePlayersStore()
  const { context } = useOrganizationContext()
  const { isSystemAdmin } = context
  const isEditing = !!player

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: player?.name || '',
      nameRtl: player?.nameRtl || '',
      dateOfBirth: player?.dateOfBirth
        ? parseDateFromAPI(player.dateOfBirth)
        : new Date(new Date().getFullYear() - 2, 0, 1),
      gender: player?.gender || undefined,
      preferredHand: player?.preferredHand || undefined,
      team: player?.isFirstTeam ? Team.FIRST_TEAM : Team.ROWAD_B,
      organizationId: player?.organizationId || null,
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: PlayerFormData) => {
    clearError()
    try {
      // Transform team enum to boolean for API
      const submitData = {
        ...data,
        isFirstTeam: data.team === Team.FIRST_TEAM,
      }
      // Remove team field as API expects isFirstTeam
      delete (submitData as any).team

      if (isEditing) {
        await updatePlayer(player.id, submitData)
      } else {
        await createPlayer(submitData)
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <Trophy className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Player' : 'Add New Player'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update player information for Rowad speedball team'
            : 'Register a new player for Rowad speedball team'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Name Field */}
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter player's full name"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RTL Name Field */}
          <FormField
            control={form.control}
            name='nameRtl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>RTL Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="Enter player's name in Arabic"
                    disabled={isSubmitting}
                    dir='rtl'
                    className='text-right'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date of Birth Field */}
          <FormField
            control={form.control}
            name='dateOfBirth'
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
            name='gender'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                    className='flex flex-col sm:flex-row gap-4 sm:gap-6 mt-2'
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='male' id='gender-male' />
                      <label
                        htmlFor='gender-male'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                      >
                        Male
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='female' id='gender-female' />
                      <label
                        htmlFor='gender-female'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
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
            name='preferredHand'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Hand</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                    className='flex flex-col sm:flex-row gap-4 sm:gap-6 mt-2'
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='left' id='hand-left' />
                      <label
                        htmlFor='hand-left'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                      >
                        Left Handed
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='right' id='hand-right' />
                      <label
                        htmlFor='hand-right'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
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

          {/* Team Field */}
          <FormField
            control={form.control}
            name='team'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a team' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Team.FIRST_TEAM}>
                        First Team
                      </SelectItem>
                      <SelectItem value={Team.ROWAD_B}>Rowad B</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Club Field - Only for System Admins */}
          {isSystemAdmin && (
            <FormField
              control={form.control}
              name='organizationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club</FormLabel>
                  <FormControl>
                    <ClubCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                      placeholder='Select a club (optional)'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Error Display */}
          {error && (
            <div className='bg-destructive/10 border border-destructive/20 rounded-md p-3'>
              <p className='text-destructive text-sm'>{error}</p>
            </div>
          )}

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-3 mt-4'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
                className='w-full sm:w-auto min-w-[44px] min-h-[44px]'
              >
                Cancel
              </Button>
            )}

            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full sm:w-auto min-w-[44px] min-h-[44px] bg-rowad-600 hover:bg-rowad-700'
            >
              {isSubmitting ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Save className='h-4 w-4' />
                  {isEditing ? 'Update Player' : 'Create Player'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default PlayerForm
