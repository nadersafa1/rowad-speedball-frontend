'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { apiClient } from '@/lib/api-client'

const coachProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
})

type CoachProfileSchema = z.infer<typeof coachProfileSchema>

const CoachProfileForm = ({ coach }: { coach: any }) => {
  const router = useRouter()

  const form = useForm<CoachProfileSchema>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: {
      name: coach?.name || '',
    },
  })

  const onSubmit = async (data: CoachProfileSchema) => {
    try {
      await apiClient.updateMyCoach({
        name: data.name,
      })
      toast.success('Coach profile updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update coach profile'
      )
    }
  }

  const { isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Gender</FormLabel>
          <Input
            value={
              coach?.gender
                ? coach.gender.charAt(0).toUpperCase() + coach.gender.slice(1)
                : ''
            }
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            Gender cannot be changed
          </p>
        </div>

        <Button className="w-full mt-2" disabled={isSubmitting} type="submit">
          <LoadingSwap isLoading={isSubmitting}>Update Coach Profile</LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}

export default CoachProfileForm

