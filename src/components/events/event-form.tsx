'use client'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
import { useEventsStore } from '@/store/events-store'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'
import ClubCombobox from '@/components/organizations/club-combobox'
import { useOrganizationContext } from '@/hooks/use-organization-context'

// Validation schema - matches backend schema exactly
const eventSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    eventType: z.enum(['singles', 'doubles'], {
      message: 'Event type is required',
    }),
    gender: z.enum(['male', 'female', 'mixed'], {
      message: 'Gender is required',
    }),
    groupMode: z.enum(['single', 'multiple'], {
      message: 'Group mode is required',
    }),
    visibility: z.enum(['public', 'private']),
    registrationStartDate: z.date('Invalid date format'),
    registrationEndDate: z.date('Invalid date format'),
    bestOf: z
      .number()
      .int('bestOf must be an integer')
      .positive('bestOf must be positive')
      .refine(
        (val) => val % 2 === 1,
        'bestOf must be an odd number (1, 3, 5, 7, etc.)'
      ),
    pointsPerWin: z.number().int().min(0),
    pointsPerLoss: z.number().int().min(0),
    organizationId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) => {
      // End date must be after start date
      return data.registrationEndDate >= data.registrationStartDate
    },
    {
      message: 'End date must be after start date',
      path: ['registrationEndDate'],
    }
  )

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
  const { createEvent, updateEvent, error, clearError } = useEventsStore()
  const { context } = useOrganizationContext()
  const { isSystemAdmin } = context
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
        : undefined,
      registrationEndDate: event?.registrationEndDate
        ? new Date(event.registrationEndDate)
        : undefined,
      bestOf: event?.bestOf || 3,
      pointsPerWin: event?.pointsPerWin || 3,
      pointsPerLoss: event?.pointsPerLoss || 1,
      organizationId: event?.organizationId || null,
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: EventFormData) => {
    clearError()
    try {
      const formattedData = {
        ...data,
        registrationStartDate: data.registrationStartDate
          .toISOString()
          .split('T')[0],
        registrationEndDate: data.registrationEndDate
          .toISOString()
          .split('T')[0],
      }

      if (isEditing) {
        await updateEvent(event.id, formattedData)
      } else {
        await createEvent(formattedData)
      }

      form.reset()
      onSuccess?.()
    } catch (err) {
      console.error('Error submitting event form:', err)
      // Error is handled by the store
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
                    value={field.value}
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
                    value={field.value}
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
                    value={field.value}
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
                    value={field.value}
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

          {/* Club Field - Only for System Admins */}
          {isSystemAdmin && (
            <FormField
              control={form.control}
              name='organizationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club</FormLabel>
                  <FormControl>
                    <ClubCombobox
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting}
                      placeholder='Select a club (optional)'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {error && <div className='text-sm text-destructive'>{error}</div>}

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isSubmitting}
                className='w-full sm:w-auto'
              >
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              disabled={isSubmitting}
              className='w-full sm:w-auto'
            >
              <Save className='mr-2 h-4 w-4' />
              {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default EventForm
