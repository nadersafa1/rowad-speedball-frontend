'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { usePlacementTiersStore } from '@/store/placement-tiers-store'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { descriptionSchema } from '@/lib/forms/patterns'
import { LoadingButton, FormError } from '@/components/forms'
import type { PlacementTier } from '@/db/schema'

// Validation schema using shared patterns
const placementTierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less')
    .regex(
      /^[A-Z0-9_]+$/,
      'Name must be uppercase letters, numbers, and underscores only (e.g., WINNER, QF, R16, POS_1)'
    ),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or less')
    .optional()
    .nullable(),
  description: descriptionSchema,
  rank: z
    .number()
    .int('Rank must be an integer')
    .positive('Rank must be positive')
    .min(1, 'Rank must be at least 1'),
})

type PlacementTierFormData = z.infer<typeof placementTierSchema>

interface PlacementTierFormProps {
  tier?: PlacementTier
  onSuccess?: () => void
  onCancel?: () => void
}

const PlacementTierForm = ({
  tier,
  onSuccess,
  onCancel,
}: PlacementTierFormProps) => {
  const { createTier, updateTier, error, clearError } =
    usePlacementTiersStore()
  const isEditing = !!tier

  const form = useForm<PlacementTierFormData>({
    resolver: zodResolver(placementTierSchema),
    defaultValues: {
      name: tier?.name || '',
      displayName: tier?.displayName || '',
      description: tier?.description || '',
      rank: tier?.rank || 1,
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: PlacementTierFormData) => {
    clearError()
    try {
      const payload = {
        name: data.name,
        displayName: data.displayName || null,
        description: data.description || null,
        rank: data.rank,
      }

      if (isEditing) {
        await updateTier(tier.id, payload)
      } else {
        await createTier(payload)
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <DialogContent className='sm:max-w-[500px]'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <Trophy className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Placement Tier' : 'Add New Placement Tier'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update placement tier information'
            : 'Create a new placement tier for the ranking system'}
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
                <FormLabel>Name (Technical ID)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='WINNER, QF, R16, POS_1'
                    disabled={isSubmitting}
                    className='font-mono'
                  />
                </FormControl>
                <FormDescription>
                  Uppercase letters, numbers, and underscores only. Used internally in the system.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Display Name Field */}
          <FormField
            control={form.control}
            name='displayName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder='Winner, Quarter-Finals, Round of 16'
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Human-readable name shown to users
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rank Field */}
          <FormField
            control={form.control}
            name='rank'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rank</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='number'
                    min={1}
                    placeholder='1'
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  1 = Champion, 2 = Runner-up, 3 = Third Place, etc. Lower rank = better placement.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description Field */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder='Describe when this tier applies'
                    disabled={isSubmitting}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  Additional details about this placement tier
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormError error={error} />

          <DialogFooter>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <LoadingButton type='submit' isLoading={isSubmitting}>
              {isEditing ? 'Update Placement Tier' : 'Create Placement Tier'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default PlacementTierForm
