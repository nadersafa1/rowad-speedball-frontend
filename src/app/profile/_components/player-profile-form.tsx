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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { apiClient } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import {
  TEAM_LEVELS,
  TEAM_LEVEL_LABELS,
  DEFAULT_TEAM_LEVEL,
} from '@/types/team-level'

const playerProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  preferredHand: z.enum(['left', 'right', 'both'], {
    message: 'Preferred hand is required',
  }),
  teamLevel: z.enum(TEAM_LEVELS, {
    message: 'Team level is required',
  }),
})

type PlayerProfileSchema = z.infer<typeof playerProfileSchema>

const PlayerProfileForm = ({ player }: { player: any }) => {
  const router = useRouter()

  const form = useForm<PlayerProfileSchema>({
    resolver: zodResolver(playerProfileSchema),
    defaultValues: {
      name: player?.name || '',
      preferredHand: player?.preferredHand || 'right',
      teamLevel: player?.teamLevel || DEFAULT_TEAM_LEVEL,
    },
  })

  const onSubmit = async (data: PlayerProfileSchema) => {
    try {
      await apiClient.updateMyPlayer({
        name: data.name,
        preferredHand: data.preferredHand,
        teamLevel: data.teamLevel,
      })
      toast.success('Player profile updated successfully')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update player profile'
      )
    }
  }

  const { isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='name'
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

        <div className='space-y-2'>
          <FormLabel>Date of Birth</FormLabel>
          <Input
            value={player?.dateOfBirth ? formatDate(player.dateOfBirth) : ''}
            disabled
            className='bg-muted'
          />
          <p className='text-sm text-muted-foreground'>
            Date of birth cannot be changed
          </p>
        </div>

        <div className='space-y-2'>
          <FormLabel>Gender</FormLabel>
          <Input
            value={
              player?.gender
                ? player.gender.charAt(0).toUpperCase() + player.gender.slice(1)
                : ''
            }
            disabled
            className='bg-muted'
          />
          <p className='text-sm text-muted-foreground'>
            Gender cannot be changed
          </p>
        </div>

        <FormField
          control={form.control}
          name='preferredHand'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Hand</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                  className='flex flex-row gap-6'
                >
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='left' id='hand-left' />
                    <label
                      htmlFor='hand-left'
                      className='text-sm font-medium leading-none cursor-pointer'
                    >
                      Left
                    </label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='right' id='hand-right' />
                    <label
                      htmlFor='hand-right'
                      className='text-sm font-medium leading-none cursor-pointer'
                    >
                      Right
                    </label>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <RadioGroupItem value='both' id='hand-both' />
                    <label
                      htmlFor='hand-both'
                      className='text-sm font-medium leading-none cursor-pointer'
                    >
                      Both
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='teamLevel'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Level</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {TEAM_LEVEL_LABELS[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className='w-full mt-2' disabled={isSubmitting} type='submit'>
          <LoadingSwap isLoading={isSubmitting}>
            Update Player Profile
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}

export default PlayerProfileForm
