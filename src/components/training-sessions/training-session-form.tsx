'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Save } from 'lucide-react'
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
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { useTrainingSessionsStore } from '@/store/training-sessions-store'
import { formatDateForAPI } from '@/lib/date-utils'
import { formatDateForSessionName } from '@/db/schema'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'
import CoachesCombobox from './coaches-combobox'
import ClubCombobox from '@/components/organizations/club-combobox'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { SessionType, AgeGroup } from '@/app/sessions/types/enums'

const sessionTypeOptions = [
  { value: SessionType.SINGLES, label: 'Singles' },
  { value: SessionType.MEN_DOUBLES, label: 'Men Doubles' },
  { value: SessionType.WOMEN_DOUBLES, label: 'Women Doubles' },
  { value: SessionType.MIXED_DOUBLES, label: 'Mixed Doubles' },
  { value: SessionType.SOLO, label: 'Solo' },
  { value: SessionType.RELAY, label: 'Relay' },
]

const ageGroupOptions: Array<{ value: string; label: string }> = [
  { value: AgeGroup.MINI, label: 'Mini' },
  { value: AgeGroup.U_09, label: 'U-09' },
  { value: AgeGroup.U_11, label: 'U-11' },
  { value: AgeGroup.U_13, label: 'U-13' },
  { value: AgeGroup.U_15, label: 'U-15' },
  { value: AgeGroup.U_17, label: 'U-17' },
  { value: AgeGroup.U_19, label: 'U-19' },
  { value: AgeGroup.U_21, label: 'U-21' },
  { value: AgeGroup.SENIORS, label: 'Seniors' },
]

const trainingSessionSchema = z.object({
  name: z.string().max(255, 'Name is too long').optional(),
  intensity: z.enum(['high', 'normal', 'low'], {
    message: 'Intensity is required',
  }),
  type: z
    .array(
      z.enum([
        'singles',
        'men_doubles',
        'women_doubles',
        'mixed_doubles',
        'solo',
        'relay',
      ])
    )
    .min(1, 'At least one type is required'),
  date: z.date(),
  description: z.string().optional(),
  ageGroups: z
    .array(
      z.enum([
        'mini',
        'U-09',
        'U-11',
        'U-13',
        'U-15',
        'U-17',
        'U-19',
        'U-21',
        'Seniors',
      ])
    )
    .min(1, 'At least one age group is required'),
  coachIds: z.array(z.uuid()).optional(),
  organizationId: z.string().uuid().nullable().optional(),
  firstTeamFilter: z
    .enum(['first_team_only', 'non_first_team_only', 'all'], {
      message: 'Invalid first team filter',
    })
    .optional(),
  autoCreateAttendance: z.boolean().optional(),
})

type TrainingSessionFormData = z.infer<typeof trainingSessionSchema>

interface TrainingSessionFormProps {
  trainingSession?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const TrainingSessionForm = ({
  trainingSession,
  onSuccess,
  onCancel,
}: TrainingSessionFormProps) => {
  const {
    createTrainingSession,
    updateTrainingSession,
    isLoading,
    error,
    clearError,
  } = useTrainingSessionsStore()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, organization } = context
  const isEditing = !!trainingSession

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // For non-admin users, use their active organization
  const defaultOrganizationId = isSystemAdmin
    ? trainingSession?.organizationId || null
    : organization?.id || null

  const form = useForm<TrainingSessionFormData>({
    resolver: zodResolver(trainingSessionSchema),
    defaultValues: {
      name: trainingSession?.name || '',
      intensity: trainingSession?.intensity || 'normal',
      type: trainingSession?.type || [],
      date: trainingSession?.date
        ? typeof trainingSession.date === 'string'
          ? new Date(trainingSession.date)
          : new Date(trainingSession.date)
        : today,
      description: trainingSession?.description || '',
      ageGroups: trainingSession?.ageGroups || [],
      coachIds: trainingSession?.coaches?.map((c: any) => c.id) || [],
      organizationId: defaultOrganizationId,
      firstTeamFilter: 'all',
      autoCreateAttendance: false,
    },
  })

  const watchedDate = form.watch('date')
  const watchedName = form.watch('name')
  const watchedOrganizationId = form.watch('organizationId')

  // Determine which organizationId to use for filtering coaches
  // - System admin: use selected organizationId (can be null for global)
  // - Non-admin: use their active organization (always filtered)
  const coachesOrganizationId = isSystemAdmin
    ? watchedOrganizationId
    : organization?.id || null

  // Auto-generate name from date if name is empty
  React.useEffect(() => {
    if (!watchedName && watchedDate) {
      const autoName = formatDateForSessionName(watchedDate)
      form.setValue('name', autoName, { shouldValidate: false })
    }
  }, [watchedDate, watchedName, form])

  const onSubmit = async (data: TrainingSessionFormData) => {
    clearError()
    try {
      // For non-admin users, ensure organizationId is set to their active organization
      const finalOrganizationId = isSystemAdmin
        ? data.organizationId
        : organization?.id || null

      if (isEditing) {
        // For updates, exclude organizationId as it's not allowed in the update schema
        const { organizationId: _, ...updateData } = data
        const submitData = {
          ...updateData,
          date: formatDateForAPI(data.date),
          name: data.name || formatDateForSessionName(data.date),
        }
        await updateTrainingSession(trainingSession.id, submitData)
      } else {
        // For creates, include organizationId and set defaults for new fields
        const submitData = {
          ...data,
          date: formatDateForAPI(data.date),
          name: data.name || formatDateForSessionName(data.date),
          organizationId: finalOrganizationId,
          firstTeamFilter: data.firstTeamFilter || 'all',
          autoCreateAttendance: data.autoCreateAttendance ?? false,
        }
        await createTrainingSession(submitData)
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <Calendar className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Training Session' : 'Add New Training Session'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update training session information'
            : 'Create a new training session'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='date'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='intensity'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intensity</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select intensity' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='high'>High</SelectItem>
                      <SelectItem value='normal'>Normal</SelectItem>
                      <SelectItem value='low'>Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='Auto-generated from date'
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Leave empty to auto-generate from date
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='type'
            render={() => (
              <FormItem>
                <div className='mb-4'>
                  <FormLabel>Type</FormLabel>
                  <FormDescription>
                    Select one or more session types
                  </FormDescription>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                  {sessionTypeOptions.map((option) => (
                    <FormField
                      key={option.value}
                      control={form.control}
                      name='type'
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={option.value}
                            className='flex flex-row items-start space-x-3 space-y-0'
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(
                                  option.value as
                                    | 'singles'
                                    | 'men_doubles'
                                    | 'women_doubles'
                                    | 'mixed_doubles'
                                    | 'solo'
                                    | 'relay'
                                )}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        option.value as
                                          | 'singles'
                                          | 'men_doubles'
                                          | 'women_doubles'
                                          | 'mixed_doubles'
                                          | 'solo'
                                          | 'relay',
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== option.value
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='ageGroups'
            render={() => (
              <FormItem>
                <div className='mb-4'>
                  <FormLabel>Age Groups</FormLabel>
                  <FormDescription>
                    Select one or more age groups
                  </FormDescription>
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                  {ageGroupOptions.map((option) => (
                    <FormField
                      key={option.value}
                      control={form.control}
                      name='ageGroups'
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={option.value}
                            className='flex flex-row items-start space-x-3 space-y-0'
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(
                                  option.value as
                                    | 'mini'
                                    | 'U-09'
                                    | 'U-11'
                                    | 'U-13'
                                    | 'U-15'
                                    | 'U-17'
                                    | 'U-19'
                                    | 'U-21'
                                    | 'Seniors'
                                )}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        option.value as
                                          | 'mini'
                                          | 'U-09'
                                          | 'U-11'
                                          | 'U-13'
                                          | 'U-15'
                                          | 'U-17'
                                          | 'U-19'
                                          | 'U-21'
                                          | 'Seniors',
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== option.value
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className='font-normal'>
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Club Field - Only for System Admin */}
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
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Clear coaches when club changes
                        form.setValue('coachIds', [])
                      }}
                      disabled={isLoading}
                      placeholder='Select a club...'
                    />
                  </FormControl>
                  <FormDescription>
                    Select the club for this training session
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name='coachIds'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coaches</FormLabel>
                <FormControl>
                  <CoachesCombobox
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                    organizationId={coachesOrganizationId}
                  />
                </FormControl>
                <FormDescription>
                  Select one or more coaches for this session
                  {coachesOrganizationId && ' (filtered by selected club)'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* First Team Filter - Only show when creating (not editing) */}
          {!isEditing && (
            <FormField
              control={form.control}
              name='firstTeamFilter'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Team Filter</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select filter option' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='all'>All Players</SelectItem>
                      <SelectItem value='first_team_only'>
                        First Team Only
                      </SelectItem>
                      <SelectItem value='non_first_team_only'>
                        Non-First Team Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Filter players by first team status when auto-creating
                    attendance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Auto-Create Attendance - Only show when creating (not editing) */}
          {!isEditing && (
            <FormField
              control={form.control}
              name='autoCreateAttendance'
              render={({ field }) => (
                <FormItem>
                  <div
                    className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent/50 transition-colors'
                    onClick={() => {
                      if (!isLoading) {
                        field.onChange(!field.value)
                      }
                    }}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </div>
                    <div className='space-y-1 leading-none flex-1'>
                      <FormLabel className='cursor-pointer'>
                        Auto-Create Attendance Records
                      </FormLabel>
                      <FormDescription>
                        Automatically create attendance records with
                        &apos;pending&apos; status for all players matching the
                        selected age groups and first team filter
                      </FormDescription>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder='Enter session description...'
                    disabled={isLoading}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className='bg-destructive/10 border border-destructive/20 rounded-md p-3'>
              <p className='text-destructive text-sm'>{error}</p>
            </div>
          )}

          <DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-3 mt-4'>
            {onCancel && (
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isLoading}
                className='w-full sm:w-auto min-w-[44px] min-h-[44px]'
              >
                Cancel
              </Button>
            )}
            <Button
              type='submit'
              disabled={isLoading}
              className='w-full sm:w-auto min-w-[44px] min-h-[44px] bg-rowad-600 hover:bg-rowad-700'
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Save className='h-4 w-4' />
                  {isEditing ? 'Update Session' : 'Create Session'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default TrainingSessionForm
