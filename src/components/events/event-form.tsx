'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Calendar } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useEventsStore } from '@/store/events-store'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'
import { DatePicker } from '@/components/ui/date-picker'

// Validation schema
const eventSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be less than 255 characters'),
  eventType: z.enum(['singles', 'doubles'], {
    message: 'Event type is required',
  }),
  gender: z.enum(['male', 'female', 'mixed'], {
    message: 'Gender is required',
  }),
  groupMode: z.enum(['single', 'multiple'], {
    message: 'Group mode is required',
  }),
  visibility: z.enum(['public', 'private']).default('public'),
  registrationStartDate: z.date().optional().nullable(),
  registrationEndDate: z.date().optional().nullable(),
  bestOf: z
    .number()
    .int('bestOf must be an integer')
    .positive('bestOf must be positive')
    .refine(
      (val) => val % 2 === 1,
      'bestOf must be an odd number (1, 3, 5, 7, etc.)'
    ),
  pointsPerWin: z.number().int().min(0).default(3),
  pointsPerLoss: z.number().int().min(0).default(0),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventFormProps {
  event?: any
  onSuccess?: () => void
  onCancel?: () => void
  hasRegistrations?: boolean
  hasPlayedSets?: boolean
}

const EventForm = ({
  event,
  onSuccess,
  onCancel,
  hasRegistrations = false,
  hasPlayedSets = false,
}: EventFormProps) => {
  const { createEvent, updateEvent, isLoading, error, clearError } =
    useEventsStore()
  const isEditing = !!event

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name || '',
      eventType: event?.eventType || 'singles',
      gender: event?.gender || 'male',
      groupMode: event?.groupMode || 'single',
      visibility: event?.visibility || 'public',
      registrationStartDate: event?.registrationStartDate
        ? new Date(event.registrationStartDate)
        : null,
      registrationEndDate: event?.registrationEndDate
        ? new Date(event.registrationEndDate)
        : null,
      bestOf: event?.bestOf || 3,
      pointsPerWin: event?.pointsPerWin || 3,
      pointsPerLoss: event?.pointsPerLoss || 1,
    },
  })

  const onSubmit = async (data: EventFormData) => {
    try {
      clearError()
      const formattedData = {
        ...data,
        registrationStartDate: data.registrationStartDate
          ? data.registrationStartDate.toISOString().split('T')[0]
          : null,
        registrationEndDate: data.registrationEndDate
          ? data.registrationEndDate.toISOString().split('T')[0]
          : null,
      }

      if (isEditing) {
        await updateEvent(event.id, formattedData)
      } else {
        await createEvent(formattedData)
      }

      onSuccess?.()
    } catch (err) {
      console.error('Error submitting event form:', err)
    }
  }

  return (
    <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update event details below.'
            : 'Fill in the details to create a new event.'}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name</FormLabel>
                <FormControl>
                  <Input placeholder='Enter event name' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='eventType'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing && hasRegistrations}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select event type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='singles'>Singles</SelectItem>
                      <SelectItem value='doubles'>Doubles</SelectItem>
                    </SelectContent>
                  </Select>
                  {isEditing && hasRegistrations && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change event type once registrations exist
                    </p>
                  )}
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditing && hasRegistrations}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select gender' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='male'>Male</SelectItem>
                      <SelectItem value='female'>Female</SelectItem>
                      <SelectItem value='mixed'>Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                  {isEditing && hasRegistrations && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change gender once registrations exist
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='groupMode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group Mode</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className='flex flex-col sm:flex-row gap-4 sm:gap-6'
                    disabled={isEditing && hasPlayedSets}
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem
                        value='single'
                        id='single'
                        disabled={isEditing && hasPlayedSets}
                      />
                      <label
                        htmlFor='single'
                        className={
                          isEditing && hasPlayedSets
                            ? 'text-muted-foreground cursor-not-allowed'
                            : ''
                        }
                      >
                        Single Group
                      </label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem
                        value='multiple'
                        id='multiple'
                        disabled={isEditing && hasPlayedSets}
                      />
                      <label
                        htmlFor='multiple'
                        className={
                          isEditing && hasPlayedSets
                            ? 'text-muted-foreground cursor-not-allowed'
                            : ''
                        }
                      >
                        Multiple Groups
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                {isEditing && hasPlayedSets && (
                  <p className='text-xs text-muted-foreground'>
                    Cannot change group mode once sets are played
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='visibility'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visibility</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className='flex flex-col sm:flex-row gap-4 sm:gap-6'
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='public' id='public' />
                      <label htmlFor='public'>Public</label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='private' id='private' />
                      <label htmlFor='private'>Private</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='registrationStartDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value || undefined}
                      onDateChange={field.onChange}
                      disabled={isEditing && hasPlayedSets}
                    />
                  </FormControl>
                  {isEditing && hasPlayedSets && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change registration dates once sets are played
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='registrationEndDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value || undefined}
                      onDateChange={field.onChange}
                      disabled={isEditing && hasPlayedSets}
                    />
                  </FormControl>
                  {isEditing && hasPlayedSets && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change registration dates once sets are played
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <FormField
              control={form.control}
              name='bestOf'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Best Of (Sets)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='3'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 3)
                      }
                      onFocus={(e) => e.target.select()}
                      min={1}
                      disabled={isEditing && hasPlayedSets}
                      step={2}
                    />
                  </FormControl>
                  {isEditing && hasPlayedSets && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change bestOf once sets are played
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='pointsPerWin'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points Per Win</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='3'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 3)
                      }
                      onFocus={(e) => e.target.select()}
                      min={0}
                      disabled={isEditing && hasPlayedSets}
                    />
                  </FormControl>
                  {isEditing && hasPlayedSets && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change points per win once sets are played
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='pointsPerLoss'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points Per Loss</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='0'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                      onFocus={(e) => e.target.select()}
                      min={0}
                      disabled={isEditing && hasPlayedSets}
                    />
                  </FormControl>
                  {isEditing && hasPlayedSets && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change points per loss once sets are played
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {error && <div className='text-sm text-destructive'>{error}</div>}

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              disabled={isLoading}
              className='w-full sm:w-auto'
            >
              <Save className='mr-2 h-4 w-4' />
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default EventForm
