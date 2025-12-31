'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { LoadingButton } from '@/components/forms'
import type { Set } from '@/types'

// Validation schema - same as AddSetForm
const setEditorSchema = z
  .object({
    registration1Score: z
      .number()
      .int('Score must be a whole number')
      .min(0, 'Score cannot be negative'),
    registration2Score: z
      .number()
      .int('Score must be a whole number')
      .min(0, 'Score cannot be negative'),
  })
  .refine((data) => data.registration1Score !== data.registration2Score, {
    message: 'Scores cannot be tied - one player must win the set',
    path: ['registration1Score'],
  })

type SetEditorFormData = z.infer<typeof setEditorSchema>

interface SetEditorProps {
  set: Set
  player1Name: string
  player2Name: string
  onSaveScores: (scores: {
    registration1Score: number
    registration2Score: number
  }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

/**
 * Inline editor for editing set scores.
 * Migrated to React Hook Form for consistency and better validation.
 */
const SetEditor = ({
  set,
  player1Name,
  player2Name,
  onSaveScores,
  onCancel,
  isLoading = false,
}: SetEditorProps) => {
  const form = useForm<SetEditorFormData>({
    resolver: zodResolver(setEditorSchema),
    defaultValues: {
      registration1Score: set.registration1Score,
      registration2Score: set.registration2Score,
    },
  })

  const { isSubmitting } = form.formState

  const handleSubmit = async (data: SetEditorFormData) => {
    await onSaveScores(data)
    onCancel()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='registration1Score'
            render={({ field }) => (
              <FormItem>
                <label className='text-sm font-medium text-muted-foreground mb-1 block break-words'>
                  {player1Name}
                </label>
                <FormControl>
                  <Input
                    type='number'
                    inputMode='numeric'
                    className='text-center'
                    disabled={isLoading || isSubmitting}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='registration2Score'
            render={({ field }) => (
              <FormItem>
                <label className='text-sm font-medium text-muted-foreground mb-1 block break-words'>
                  {player2Name}
                </label>
                <FormControl>
                  <Input
                    type='number'
                    inputMode='numeric'
                    className='text-center'
                    disabled={isLoading || isSubmitting}
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0
                      )
                    }
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.currentTarget.select()}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        <FormMessage />
        <div className='flex gap-2'>
          <LoadingButton
            type='button'
            variant='outline'
            size='sm'
            onClick={onCancel}
            className='flex-1'
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </LoadingButton>
          <LoadingButton
            type='submit'
            variant='default'
            size='sm'
            className='flex-1'
            isLoading={isLoading || isSubmitting}
            loadingText='Saving...'
            disabled={isLoading || isSubmitting}
          >
            Save
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}

export default SetEditor
