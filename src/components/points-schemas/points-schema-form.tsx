'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Award } from 'lucide-react'
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
import { usePointsSchemasStore } from '@/store/points-schemas-store'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { nameSchema, descriptionSchema } from '@/lib/forms/patterns'
import { LoadingButton, FormError } from '@/components/forms'
import type { PointsSchema } from '@/db/schema'

// Validation schema using shared patterns
const pointsSchemaSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
})

type PointsSchemaFormData = z.infer<typeof pointsSchemaSchema>

interface PointsSchemaFormProps {
  schema?: PointsSchema
  onSuccess?: () => void
  onCancel?: () => void
}

const PointsSchemaForm = ({
  schema,
  onSuccess,
  onCancel,
}: PointsSchemaFormProps) => {
  const { createSchema, updateSchema, error, clearError } =
    usePointsSchemasStore()
  const isEditing = !!schema

  const form = useForm<PointsSchemaFormData>({
    resolver: zodResolver(pointsSchemaSchema),
    defaultValues: {
      name: schema?.name || '',
      description: schema?.description || '',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: PointsSchemaFormData) => {
    clearError()
    try {
      const payload = {
        name: data.name,
        description: data.description || null,
      }

      if (isEditing) {
        await updateSchema(schema.id, payload)
      } else {
        await createSchema(payload)
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
          <Award className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Points Schema' : 'Add New Points Schema'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update points schema information'
            : 'Create a new points schema for awarding championship points'}
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
                    placeholder='National Championship 2024'
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  A descriptive name for this points schema (e.g., &quot;National Championship 2024&quot;, &quot;Regional League Points&quot;)
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
                    placeholder='Describe the purpose and scope of this points schema'
                    disabled={isSubmitting}
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  Additional details about when and how this points schema should be used
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
              {isEditing ? 'Update Points Schema' : 'Create Points Schema'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default PointsSchemaForm
