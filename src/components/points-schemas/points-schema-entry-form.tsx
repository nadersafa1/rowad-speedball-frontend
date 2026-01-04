'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { usePointsSchemaEntriesStore } from '@/store/points-schema-entries-store'
import { usePlacementTiersStore } from '@/store/placement-tiers-store'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { LoadingButton, FormError } from '@/components/forms'

// Validation schema
const pointsSchemaEntrySchema = z.object({
  placementTierId: z.string().uuid('Please select a placement tier'),
  points: z
    .number()
    .int('Points must be an integer')
    .min(0, 'Points must be non-negative')
    .max(10000, 'Points must be 10,000 or less'),
})

type PointsSchemaEntryFormData = z.infer<typeof pointsSchemaEntrySchema>

interface PointsSchemaEntryFormProps {
  pointsSchemaId: string
  entry?: any // Enhanced entry with related data
  existingTierIds?: string[] // IDs of tiers already in this schema
  onSuccess?: () => void
  onCancel?: () => void
}

const PointsSchemaEntryForm = ({
  pointsSchemaId,
  entry,
  existingTierIds = [],
  onSuccess,
  onCancel,
}: PointsSchemaEntryFormProps) => {
  const { createEntry, updateEntry, error, clearError } =
    usePointsSchemaEntriesStore()
  const { tiers, fetchTiers, isLoading: tiersLoading } = usePlacementTiersStore()
  const isEditing = !!entry

  // Fetch placement tiers on mount
  useEffect(() => {
    fetchTiers({ sortBy: 'rank', sortOrder: 'asc', limit: 100 })
  }, [fetchTiers])

  const form = useForm<PointsSchemaEntryFormData>({
    resolver: zodResolver(pointsSchemaEntrySchema),
    defaultValues: {
      placementTierId: entry?.placementTierId || '',
      points: entry?.points || 0,
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: PointsSchemaEntryFormData) => {
    clearError()
    try {
      if (isEditing) {
        // Only update points when editing
        await updateEntry(entry.id, { points: data.points })
      } else {
        // Create new entry
        await createEntry({
          pointsSchemaId,
          placementTierId: data.placementTierId,
          points: data.points,
        })
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Filter out tiers that are already used (except for editing)
  const availableTiers = tiers.filter(
    (tier) =>
      !existingTierIds.includes(tier.id) || tier.id === entry?.placementTierId
  )

  return (
    <DialogContent className='sm:max-w-[500px]'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <Trophy className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Points Entry' : 'Add Points Entry'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update the points awarded for this placement tier'
            : 'Define how many points are awarded for a specific placement tier'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Placement Tier Field */}
          <FormField
            control={form.control}
            name='placementTierId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placement Tier</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting || tiersLoading || isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a placement tier' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className='max-h-[300px]'>
                    {tiersLoading ? (
                      <div className='p-2 text-sm text-muted-foreground'>
                        Loading tiers...
                      </div>
                    ) : availableTiers.length === 0 ? (
                      <div className='p-2 text-sm text-muted-foreground'>
                        {isEditing
                          ? 'No tiers available'
                          : 'All tiers are already assigned to this schema'}
                      </div>
                    ) : (
                      availableTiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          <div className='flex items-center gap-2'>
                            <span className='font-mono font-semibold'>
                              {tier.name}
                            </span>
                            {tier.displayName && (
                              <span className='text-muted-foreground'>
                                - {tier.displayName}
                              </span>
                            )}
                            <span className='text-xs text-muted-foreground'>
                              (Rank: {tier.rank})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {isEditing
                    ? 'Placement tier cannot be changed. Delete and recreate to change the tier.'
                    : 'Select which placement tier this points value applies to'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Points Field */}
          <FormField
            control={form.control}
            name='points'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='number'
                    min={0}
                    max={10000}
                    placeholder='100'
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Number of points awarded for this placement (0-10,000)
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
              {isEditing ? 'Update Entry' : 'Create Entry'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default PointsSchemaEntryForm
