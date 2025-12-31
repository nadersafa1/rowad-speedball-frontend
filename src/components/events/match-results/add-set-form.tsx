'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/forms'

// Validation schema
const addSetSchema = z
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

type AddSetFormData = z.infer<typeof addSetSchema>

interface AddSetFormProps {
  player1Name: string
  player2Name: string
  isLoading: boolean
  hasMatchDate: boolean
  onAddSet: (scores: { registration1Score: number; registration2Score: number }) => Promise<void>
}

/**
 * Form for adding a new set to a match.
 * Migrated to React Hook Form for consistency and better validation.
 */
const AddSetForm = ({
  player1Name,
  player2Name,
  isLoading,
  hasMatchDate,
  onAddSet,
}: AddSetFormProps) => {
  const form = useForm<AddSetFormData>({
    resolver: zodResolver(addSetSchema),
    defaultValues: {
      registration1Score: 0,
      registration2Score: 0,
    },
  })

  const { isSubmitting } = form.formState

  const handleSubmit = async (data: AddSetFormData) => {
    await onAddSet(data)
    form.reset()
  }

  const canSubmit = hasMatchDate && !isLoading && !isSubmitting

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-sm'>Add New Set</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-2'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='registration1Score'
                render={({ field }) => (
                  <FormItem>
                    <label className='text-sm font-medium text-muted-foreground mb-1 block'>
                      {player1Name}
                    </label>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='numeric'
                        placeholder='0'
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
                    <label className='text-sm font-medium text-muted-foreground mb-1 block'>
                      {player2Name}
                    </label>
                    <FormControl>
                      <Input
                        type='number'
                        inputMode='numeric'
                        placeholder='0'
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
            <LoadingButton
              type='submit'
              isLoading={isLoading || isSubmitting}
              loadingText='Adding...'
              icon={<Plus className='h-4 w-4' />}
              disabled={!canSubmit}
              className='w-full'
            >
              Add Set
            </LoadingButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default AddSetForm

