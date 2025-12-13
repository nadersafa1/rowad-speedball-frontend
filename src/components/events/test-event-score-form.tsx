'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Registration } from '@/types'

const scoreFormSchema = z.object({
  leftHandScore: z.number().int().min(0),
  rightHandScore: z.number().int().min(0),
  forehandScore: z.number().int().min(0),
  backhandScore: z.number().int().min(0),
})

type ScoreFormData = z.infer<typeof scoreFormSchema>

interface TestEventScoreFormProps {
  registration: Registration
  isOpen: boolean
  onClose: () => void
  onSubmit: (registrationId: string, scores: ScoreFormData) => Promise<void>
  isLoading?: boolean
}

const TestEventScoreForm = ({
  registration,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: TestEventScoreFormProps) => {
  const form = useForm<ScoreFormData>({
    resolver: zodResolver(scoreFormSchema),
    defaultValues: {
      leftHandScore: registration.leftHandScore ?? 0,
      rightHandScore: registration.rightHandScore ?? 0,
      forehandScore: registration.forehandScore ?? 0,
      backhandScore: registration.backhandScore ?? 0,
    },
  })

  const handleSubmit = async (data: ScoreFormData) => {
    await onSubmit(registration.id, data)
    onClose()
  }

  const playerName =
    registration.players?.map((p) => p.name).join(' & ') || 'Unknown Player'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Scores - {playerName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='leftHandScore'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Left Hand (L)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='rightHandScore'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Right Hand (R)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='forehandScore'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forehand (F)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='backhandScore'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backhand (B)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={onClose}>
                Cancel
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Scores'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default TestEventScoreForm
