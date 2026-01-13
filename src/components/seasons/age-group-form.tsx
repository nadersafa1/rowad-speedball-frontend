'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { useSeasonAgeGroupsStore } from '@/store/season-age-groups-store'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { LoadingButton, FormError } from '@/components/forms'
import type { SeasonAgeGroup } from '@/db/schema'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

// Form validation schema
const ageGroupFormSchema = z
  .object({
    code: z
      .string()
      .min(1, 'Code is required')
      .max(20, 'Code must be 20 characters or less')
      .regex(
        /^[A-Z0-9-]+$/,
        'Code must contain only uppercase letters, numbers, and hyphens (e.g., U-16, U-19, SENIORS)'
      ),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less'),
    minAge: z.coerce
      .number()
      .int('Age must be a whole number')
      .min(0, 'Age cannot be negative')
      .max(150, 'Age must be realistic')
      .optional(),
    maxAge: z.coerce
      .number()
      .int('Age must be a whole number')
      .min(0, 'Age cannot be negative')
      .max(150, 'Age must be realistic')
      .optional(),
    displayOrder: z.coerce
      .number()
      .int('Display order must be a whole number')
      .min(0, 'Display order cannot be negative')
      .default(0),
  })
  .refine(
    (data) => {
      // If both min and max are provided, max must be >= min
      if (data.minAge && data.maxAge) {
        return Number(data.maxAge) >= Number(data.minAge)
      }
      return true
    },
    {
      message: 'Maximum age must be greater than or equal to minimum age',
      path: ['maxAge'],
    }
  )

type AgeGroupFormData = z.infer<typeof ageGroupFormSchema>

interface AgeGroupFormProps {
  seasonId: string
  ageGroup?: SeasonAgeGroup
  onSuccess?: () => void
  onCancel?: () => void
}

const AgeGroupForm = ({
  seasonId,
  ageGroup,
  onSuccess,
  onCancel,
}: AgeGroupFormProps) => {
  const { createAgeGroup, updateAgeGroup, error, clearError } =
    useSeasonAgeGroupsStore()
  const isEditing = !!ageGroup

  const form = useForm({
    resolver: zodResolver(ageGroupFormSchema) as any,
    defaultValues: {
      code: ageGroup?.code || '',
      name: ageGroup?.name || '',
      minAge: ageGroup?.minAge ?? '',
      maxAge: ageGroup?.maxAge ?? '',
      displayOrder: ageGroup?.displayOrder || 0,
    },
  })

  const { isSubmitting } = form.formState

  // Watch min/max age to show warning when both are null
  const watchedMinAge = form.watch('minAge')
  const watchedMaxAge = form.watch('maxAge')
  const noAgeRestrictions =
    (watchedMinAge === null || watchedMinAge === '') &&
    (watchedMaxAge === null || watchedMaxAge === '')

  const onSubmit = async (data: AgeGroupFormData) => {
    clearError()

    try {
      const payload = {
        seasonId,
        code: data.code,
        name: data.name,
        minAge:
          data.minAge === null || data.minAge === undefined
            ? null
            : Number(data.minAge),
        maxAge:
          data.maxAge === null || data.maxAge === undefined
            ? null
            : Number(data.maxAge),
        displayOrder: data.displayOrder,
      }

      if (isEditing) {
        await updateAgeGroup(ageGroup.id, payload)
      } else {
        await createAgeGroup(payload)
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
          <Users className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Age Group' : 'Add New Age Group'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update age group information and age restrictions'
            : 'Create a new age group for this season'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit as any)}
          className='space-y-6'
        >
          {/* Code Field */}
          <FormField
            control={form.control}
            name='code'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code (Technical ID)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='U-16, U-19, SENIORS'
                    disabled={isSubmitting}
                    className='font-mono uppercase'
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormDescription>
                  Uppercase letters, numbers, and hyphens only. Used for system
                  identification.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Name Field */}
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='e.g., Under 16, Under 19, Seniors'
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

          {/* Age Range Fields */}
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='minAge'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Age (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min={0}
                      max={150}
                      placeholder='e.g., 16'
                      disabled={isSubmitting}
                      value={field.value === null ? '' : field.value}
                    />
                  </FormControl>
                  <FormDescription className='text-xs'>
                    Leave blank for no minimum
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='maxAge'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Age (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min={0}
                      max={150}
                      placeholder='e.g., 18'
                      disabled={isSubmitting}
                      value={field.value === null ? '' : field.value}
                    />
                  </FormControl>
                  <FormDescription className='text-xs'>
                    Leave blank for no maximum
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Warning for no age restrictions */}
          {noAgeRestrictions && (
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='text-sm'>
                No age restrictions set. Players of any age can register for
                this group. Age warnings will still be shown during
                registration, but won't block players from registering.
              </AlertDescription>
            </Alert>
          )}

          {/* Display Order Field */}
          <FormField
            control={form.control}
            name='displayOrder'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='number'
                    min={0}
                    placeholder='0'
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Controls sort order in dropdowns and lists. Lower numbers
                  appear first (0, 1, 2...).
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
              {isEditing ? 'Update Age Group' : 'Create Age Group'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default AgeGroupForm
