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
import { Checkbox } from '@/components/ui/checkbox'
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
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { format, addDays } from 'date-fns'
import { apiClient } from '@/lib/api-client'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'
import ClubCombobox from '@/components/organizations/club-combobox'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import {
  UI_EVENT_TYPES,
  EVENT_TYPE_LABELS,
  isTestEventType,
  isSoloTestEventType,
  isSoloEventType,
} from '@/types/event-types'
import { EVENT_FORMATS, EVENT_FORMAT_LABELS } from '@/types/event-format'

// Event format options
const EVENT_FORMAT_OPTIONS = [
  { value: 'groups', label: EVENT_FORMAT_LABELS.groups },
  {
    value: 'single-elimination',
    label: EVENT_FORMAT_LABELS['single-elimination'],
  },
  {
    value: 'double-elimination',
    label: EVENT_FORMAT_LABELS['double-elimination'],
  },
] as const

// Losers bracket start options for double elimination
const LOSERS_BRACKET_START_OPTIONS = [
  { value: 'full', label: 'Full Double Elimination' },
  { value: '2', label: 'QF' },
  { value: '3', label: 'R16' },
  { value: '4', label: 'R32' },
  { value: '5', label: 'R64' },
] as const

// Validation schema - matches backend schema exactly
const eventSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    eventType: z.enum(UI_EVENT_TYPES, {
      message: 'Event type is required',
    }),
    gender: z.enum(['male', 'female', 'mixed'], {
      message: 'Gender is required',
    }),
    format: z.enum(
      [
        'groups',
        'single-elimination',
        'groups-knockout',
        'double-elimination',
        'tests',
      ],
      {
        message: 'Format is required',
      }
    ),
    visibility: z.enum(['public', 'private']),
    minPlayers: z.number().int().min(1, 'Must be at least 1'),
    maxPlayers: z.number().int().min(1, 'Must be at least 1'),
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
    pointsPerWin: z.number().int().min(0).optional(),
    pointsPerLoss: z.number().int().min(0).optional(),
    // For single-elimination: whether to include a third place match
    hasThirdPlaceMatch: z.boolean().optional(),
    // For double-elimination: how many rounds before finals the losers bracket starts
    losersStartRoundsBeforeFinal: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    // For test events: number of players per heat
    playersPerHeat: z.number().int().min(1).optional(),
    organizationId: z.uuid().nullable().optional(),
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
  .refine((data) => data.minPlayers <= data.maxPlayers, {
    message: 'Min players must be less than or equal to max players',
    path: ['minPlayers'],
  })
  .refine(
    (data) => {
      // Points per win/loss are required only for groups format
      if (data.format === 'groups' || data.format === 'groups-knockout') {
        return (
          data.pointsPerWin !== undefined && data.pointsPerLoss !== undefined
        )
      }
      return true
    },
    {
      message: 'Points per win and loss are required for groups format',
      path: ['pointsPerWin'],
    }
  )

type EventFormData = z.infer<typeof eventSchema>

interface EventFormProps {
  event?: any
  onSuccess?: () => void
  onCancel?: () => void
  hasRegistrations?: boolean
  hasPlayedSets?: boolean
  trainingSessionId?: string
}

const EventForm = ({
  event,
  onSuccess,
  onCancel,
  hasRegistrations = false,
  hasPlayedSets = false,
  trainingSessionId,
}: EventFormProps) => {
  const { createEvent, updateEvent, error, clearError } = useEventsStore()
  const { context } = useOrganizationContext()
  const { isSystemAdmin } = context
  const isEditing = !!event
  const [trainingSession, setTrainingSession] = useState<any>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(false)

  // Fetch training session data if trainingSessionId is provided
  useEffect(() => {
    if (trainingSessionId && !isEditing) {
      setIsLoadingSession(true)
      apiClient
        .getTrainingSession(trainingSessionId)
        .then((session) => {
          setTrainingSession(session)
        })
        .catch((error) => {
          console.error('Error fetching training session:', error)
        })
        .finally(() => {
          setIsLoadingSession(false)
        })
    }
  }, [trainingSessionId, isEditing])

  // Calculate default dates from training session
  const getDefaultDates = () => {
    if (trainingSession?.date) {
      const sessionDate = new Date(trainingSession.date)
      return {
        startDate: sessionDate,
        endDate: addDays(sessionDate, 7), // 7 days after session date
      }
    }
    return {
      startDate: event?.registrationStartDate
        ? new Date(event.registrationStartDate)
        : undefined,
      endDate: event?.registrationEndDate
        ? new Date(event.registrationEndDate)
        : undefined,
    }
  }

  const defaultDates = getDefaultDates()

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name || '',
      eventType: event?.eventType || 'singles',
      gender: event?.gender || 'male',
      format: event?.format || 'groups',
      visibility:
        event?.visibility || (trainingSessionId ? 'private' : 'public'),
      minPlayers: event?.minPlayers || 1,
      maxPlayers: event?.maxPlayers || 1,
      registrationStartDate: defaultDates.startDate,
      registrationEndDate: defaultDates.endDate,
      bestOf: event?.bestOf || 3,
      pointsPerWin:
        event?.format === 'groups' || event?.format === 'groups-knockout'
          ? event?.pointsPerWin ?? 3
          : undefined,
      pointsPerLoss:
        event?.format === 'groups' || event?.format === 'groups-knockout'
          ? event?.pointsPerLoss ?? 0
          : undefined,
      hasThirdPlaceMatch:
        event?.format === 'single-elimination'
          ? event?.hasThirdPlaceMatch ?? false
          : false,
      losersStartRoundsBeforeFinal:
        event?.format === 'double-elimination'
          ? event?.losersStartRoundsBeforeFinal ?? null
          : null,
      playersPerHeat: event?.playersPerHeat ?? 8,
      organizationId:
        event?.organizationId || trainingSession?.organizationId || null,
    },
  })

  // Update form when training session is loaded
  useEffect(() => {
    if (trainingSession && !isEditing) {
      if (trainingSession.organizationId) {
        form.setValue('organizationId', trainingSession.organizationId, {
          shouldDirty: false,
        })
      }
      if (trainingSession.date) {
        const sessionDate = new Date(trainingSession.date)
        form.setValue('registrationStartDate', sessionDate, {
          shouldDirty: false,
        })
        form.setValue('registrationEndDate', addDays(sessionDate, 7), {
          shouldDirty: false,
        })
      }
      // Force visibility to private for training session events
      form.setValue('visibility', 'private', { shouldDirty: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trainingSession?.id,
    trainingSession?.organizationId,
    trainingSession?.date,
    isEditing,
  ])

  const { isSubmitting } = form.formState
  const selectedFormat = form.watch('format')
  const selectedEventType = form.watch('eventType')
  const isTestEvent = isTestEventType(selectedEventType)
  const isSoloEvent = isSoloEventType(selectedEventType)

  // Handle event type changes - auto-set format and player counts for test events
  useEffect(() => {
    if (isTestEvent) {
      // Auto-set format to 'tests' for test events
      form.setValue('format', 'tests', { shouldValidate: false })
      // Auto-set min/max players based on event type
      if (isSoloTestEventType(selectedEventType)) {
        form.setValue('minPlayers', 1, { shouldValidate: false })
        form.setValue('maxPlayers', 1, { shouldValidate: false })
      } else {
        // Team test events
        form.setValue('minPlayers', 2, { shouldValidate: false })
        form.setValue('maxPlayers', 6, { shouldValidate: false })
      }
    }
  }, [selectedEventType, form, isTestEvent])

  // Handle format changes - clear or set default values
  useEffect(() => {
    if (selectedFormat === 'single-elimination') {
      // Clear points fields for single-elimination
      form.setValue('pointsPerWin', undefined, { shouldValidate: false })
      form.setValue('pointsPerLoss', undefined, { shouldValidate: false })
      form.setValue('losersStartRoundsBeforeFinal', null, {
        shouldValidate: false,
      })
    } else if (selectedFormat === 'double-elimination') {
      // Clear points fields and hasThirdPlaceMatch for double-elimination
      form.setValue('pointsPerWin', undefined, { shouldValidate: false })
      form.setValue('pointsPerLoss', undefined, { shouldValidate: false })
      form.setValue('hasThirdPlaceMatch', false, { shouldValidate: false })
    } else if (selectedFormat === 'tests') {
      // Clear all competition-related fields for test events
      form.setValue('pointsPerWin', undefined, { shouldValidate: false })
      form.setValue('pointsPerLoss', undefined, { shouldValidate: false })
      form.setValue('losersStartRoundsBeforeFinal', null, {
        shouldValidate: false,
      })
      form.setValue('hasThirdPlaceMatch', false, { shouldValidate: false })
    } else if (
      (selectedFormat === 'groups' || selectedFormat === 'groups-knockout') &&
      !form.getValues('pointsPerWin')
    ) {
      // Set default values for groups format if not already set
      form.setValue('pointsPerWin', 3, { shouldValidate: false })
      form.setValue('pointsPerLoss', 0, { shouldValidate: false })
      form.setValue('losersStartRoundsBeforeFinal', null, {
        shouldValidate: false,
      })
      form.setValue('hasThirdPlaceMatch', false, { shouldValidate: false })
    }
  }, [selectedFormat, form])

  const onSubmit = async (data: EventFormData) => {
    clearError()
    try {
      const isGroupsFormat =
        data.format === 'groups' || data.format === 'groups-knockout'
      const isSingleElimination = data.format === 'single-elimination'
      const isDoubleElimination = data.format === 'double-elimination'
      const isTestFormat = data.format === 'tests'

      const formattedData = {
        ...data,
        registrationStartDate: format(data.registrationStartDate, 'yyyy-MM-dd'),
        registrationEndDate: format(data.registrationEndDate, 'yyyy-MM-dd'),
        // Points are only meaningful for groups format
        // For single-elimination and test events, set to 0 since they're not used
        pointsPerWin: isGroupsFormat ? data.pointsPerWin ?? 3 : 0,
        pointsPerLoss: isGroupsFormat ? data.pointsPerLoss ?? 0 : 0,
        // hasThirdPlaceMatch is only for single-elimination
        hasThirdPlaceMatch: isSingleElimination
          ? data.hasThirdPlaceMatch ?? false
          : false,
        // losersStartRoundsBeforeFinal is only for double-elimination
        losersStartRoundsBeforeFinal: isDoubleElimination
          ? data.losersStartRoundsBeforeFinal ?? null
          : null,
        // playersPerHeat is only for test events
        playersPerHeat: isTestFormat ? data.playersPerHeat ?? 8 : undefined,
        // bestOf defaults to 1 for test events
        bestOf: isTestFormat ? 1 : data.bestOf,
        // Training session events are always private
        visibility: trainingSessionId ? 'private' : data.visibility,
        // Include trainingSessionId if provided
        ...(trainingSessionId && { trainingSessionId }),
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
                      {UI_EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {EVENT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
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

          {!['solo', 'singles'].includes(selectedEventType) && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='minPlayers'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Players per Team</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='1'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                        onFocus={(e) => e.target.select()}
                        min={1}
                        disabled={isEditing && hasRegistrations}
                      />
                    </FormControl>
                    {isEditing && hasRegistrations && (
                      <p className='text-xs text-muted-foreground'>
                        Cannot change once registrations exist
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='maxPlayers'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Players per Team</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='2'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 2)
                        }
                        onFocus={(e) => e.target.select()}
                        min={1}
                        disabled={isEditing && hasRegistrations}
                      />
                    </FormControl>
                    {isEditing && hasRegistrations && (
                      <p className='text-xs text-muted-foreground'>
                        Cannot change once registrations exist
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Format and format-specific options - Hidden for test events */}
          {!isTestEvent && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='format'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Format</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isEditing && hasRegistrations}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select format' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_FORMAT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isEditing && hasRegistrations && (
                      <p className='text-xs text-muted-foreground'>
                        Cannot change format once registrations exist
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedFormat === 'double-elimination' && (
                <FormField
                  control={form.control}
                  name='losersStartRoundsBeforeFinal'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Losers Bracket Start</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(
                            value === 'full' ? null : parseInt(value)
                          )
                        }
                        value={
                          field.value === null ? 'full' : String(field.value)
                        }
                        disabled={isEditing && hasRegistrations}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select when losers bracket starts' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOSERS_BRACKET_START_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className='text-xs text-muted-foreground'>
                        Players who lose before this round are eliminated. Full
                        double elimination gives everyone a second chance.
                      </p>
                      {isEditing && hasRegistrations && (
                        <p className='text-xs text-muted-foreground'>
                          Cannot change once registrations exist
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedFormat === 'single-elimination' && (
                <FormField
                  control={form.control}
                  name='hasThirdPlaceMatch'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isEditing && hasRegistrations}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>Third Place Match</FormLabel>
                        <p className='text-xs text-muted-foreground'>
                          Include a match for 3rd/4th place between semi-final
                          losers
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}

          {/* Players per Heat - Only for test events */}
          {isTestEvent && (
            <FormField
              control={form.control}
              name='playersPerHeat'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Players Per Heat</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='8'
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 8)
                      }
                      onFocus={(e) => e.target.select()}
                      min={1}
                      disabled={isEditing && hasRegistrations}
                    />
                  </FormControl>
                  <p className='text-xs text-muted-foreground'>
                    Number of players that compete in each heat (round)
                  </p>
                  {isEditing && hasRegistrations && (
                    <p className='text-xs text-muted-foreground'>
                      Cannot change once registrations exist
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
                    disabled={!!trainingSessionId}
                    className='flex flex-col sm:flex-row gap-4 sm:gap-6'
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem
                        value='public'
                        id='public'
                        disabled={!!trainingSessionId}
                      />
                      <label htmlFor='public'>Public</label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem
                        value='private'
                        id='private'
                        disabled={!!trainingSessionId}
                      />
                      <label htmlFor='private'>Private</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                {trainingSessionId && (
                  <p className='text-xs text-muted-foreground'>
                    Events created from training sessions are always private
                  </p>
                )}
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

          {/* Match configuration fields - Hidden for test events and solo events */}
          {!isTestEvent && !isSoloEvent && (
            <div
              className={`grid gap-4 ${
                selectedFormat === 'groups' ||
                selectedFormat === 'groups-knockout'
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-1'
              }`}
            >
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

              {(selectedFormat === 'groups' ||
                selectedFormat === 'groups-knockout') && (
                <>
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
                </>
              )}
            </div>
          )}

          {/* Club Field - Only for System Admins, and only if not creating from training session */}
          {isSystemAdmin && !trainingSessionId && (
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
