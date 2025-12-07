'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useFederationsStore } from '@/store/federations-store'
import type { Federation } from '@/db/schema'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'

// Validation schema
const federationSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
})

type FederationFormData = z.infer<typeof federationSchema>

interface FederationFormProps {
  federation?: Federation
  onSuccess?: () => void
  onCancel?: () => void
}

const FederationForm = ({
  federation,
  onSuccess,
  onCancel,
}: FederationFormProps) => {
  const { createFederation, updateFederation, error, clearError } =
    useFederationsStore()
  const isEditing = !!federation

  const form = useForm<FederationFormData>({
    resolver: zodResolver(federationSchema),
    defaultValues: {
      name: federation?.name || '',
      description: federation?.description || '',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: FederationFormData) => {
    clearError()
    try {
      if (isEditing) {
        await updateFederation(federation.id, data)
      } else {
        await createFederation(data)
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
          <Building2 className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Federation' : 'Add New Federation'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update federation information'
            : 'Create a new federation'}
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
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='Enter federation name'
                    disabled={isSubmitting}
                  />
                </FormControl>
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
                    placeholder='Enter federation description'
                    disabled={isSubmitting}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
              {error}
            </div>
          )}

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
            <Button type='submit' disabled={isSubmitting} className='gap-2'>
              <Save className='h-4 w-4' />
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Federation'
                  : 'Create Federation'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default FederationForm

