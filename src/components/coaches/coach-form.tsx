'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Save } from 'lucide-react'
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
import { useCoachesStore } from '@/store/coaches-store'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'

const coachSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  gender: z.enum(['male', 'female'], {
    message: 'Gender is required',
  }),
})

type CoachFormData = z.infer<typeof coachSchema>

interface CoachFormProps {
  coach?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const CoachForm = ({ coach, onSuccess, onCancel }: CoachFormProps) => {
  const { createCoach, updateCoach, isLoading, error, clearError } =
    useCoachesStore()
  const isEditing = !!coach

  const form = useForm<CoachFormData>({
    resolver: zodResolver(coachSchema),
    defaultValues: {
      name: coach?.name || '',
      gender: coach?.gender || undefined,
    },
  })

  const onSubmit = async (data: CoachFormData) => {
    clearError()
    try {
      if (isEditing) {
        await updateCoach(coach.id, data)
      } else {
        await createCoach(data)
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
          <UserPlus className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Coach' : 'Add New Coach'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update coach information'
            : 'Register a new coach'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='Enter coach full name'
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    disabled={isLoading}
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
                disabled={isLoading}
                className='w-full sm:w-auto min-w-[44px] min-h-[44px]'
              >
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              disabled={isLoading}
              className='w-full sm:w-auto min-w-[44px] min-h-[44px] bg-rowad-600 hover:bg-rowad-700'
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Save className='h-4 w-4' />
                  {isEditing ? 'Update Coach' : 'Add Coach'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default CoachForm

