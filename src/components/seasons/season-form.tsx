'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useSeasonsStore } from '@/store/seasons-store'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui'
import { LoadingButton, FormError } from '@/components/forms'
import { DatePicker } from '@/components/ui/date-picker'
import { dateToISOString, isoStringToDate } from '@/lib/forms/patterns'
import type { Season } from '@/db/schema'
import { useFederation } from '@/hooks/authorization/use-federation'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

// Form validation schema
const seasonFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    startYear: z.coerce
      .number()
      .int('Start year must be an integer')
      .min(2000, 'Start year must be 2000 or later')
      .max(2100, 'Start year must be before 2100'),
    endYear: z.coerce
      .number()
      .int('End year must be an integer')
      .min(2000, 'End year must be 2000 or later')
      .max(2100, 'End year must be before 2100'),
    seasonStartDate: z.date(),
    seasonEndDate: z.date(),
    firstRegistrationStartDate: z.date().optional().nullable(),
    firstRegistrationEndDate: z.date().optional().nullable(),
    secondRegistrationStartDate: z.date().optional().nullable(),
    secondRegistrationEndDate: z.date().optional().nullable(),
    maxAgeGroupsPerPlayer: z.coerce
      .number()
      .int('Must be an integer')
      .min(1, 'Must allow at least 1 age group per player')
      .default(1),
    status: z.enum(['draft', 'active', 'closed', 'archived']).default('draft'),
  })
  .refine((data) => data.endYear === data.startYear + 1, {
    message: 'End year must be exactly 1 year after start year',
    path: ['endYear'],
  })
  .refine((data) => data.seasonEndDate > data.seasonStartDate, {
    message: 'Season end date must be after start date',
    path: ['seasonEndDate'],
  })

type SeasonFormData = z.infer<typeof seasonFormSchema>

interface SeasonFormProps {
  season?: Season
  onSuccess?: () => void
  onCancel?: () => void
}

const SeasonForm = ({ season, onSuccess, onCancel }: SeasonFormProps) => {
  const { createSeason, updateSeason, error, clearError } = useSeasonsStore()
  const { federationId } = useFederation()
  const isEditing = !!season
  const [firstPeriodOpen, setFirstPeriodOpen] = useState(!!season?.firstRegistrationStartDate)
  const [secondPeriodOpen, setSecondPeriodOpen] = useState(!!season?.secondRegistrationStartDate)

  const form = useForm({
    resolver: zodResolver(seasonFormSchema) as any,
    defaultValues: {
      name: season?.name || '',
      startYear: season?.startYear || new Date().getFullYear(),
      endYear: season?.endYear || new Date().getFullYear() + 1,
      seasonStartDate: season?.seasonStartDate
        ? isoStringToDate(season.seasonStartDate)!
        : undefined,
      seasonEndDate: season?.seasonEndDate ? isoStringToDate(season.seasonEndDate)! : undefined,
      firstRegistrationStartDate: season?.firstRegistrationStartDate
        ? isoStringToDate(season.firstRegistrationStartDate)
        : null,
      firstRegistrationEndDate: season?.firstRegistrationEndDate
        ? isoStringToDate(season.firstRegistrationEndDate)
        : null,
      secondRegistrationStartDate: season?.secondRegistrationStartDate
        ? isoStringToDate(season.secondRegistrationStartDate)
        : null,
      secondRegistrationEndDate: season?.secondRegistrationEndDate
        ? isoStringToDate(season.secondRegistrationEndDate)
        : null,
      maxAgeGroupsPerPlayer: season?.maxAgeGroupsPerPlayer || 1,
      status: season?.status || 'draft',
    },
  })

  const { isSubmitting } = form.formState
  const watchedStartYear = form.watch('startYear')

  // Auto-update end year when start year changes
  const handleStartYearChange = (value: string) => {
    const startYear = Number(value)
    form.setValue('startYear', startYear)
    form.setValue('endYear', startYear + 1)
    // Auto-generate name
    form.setValue('name', `${startYear}-${startYear + 1} Season`)
  }

  const onSubmit = async (data: SeasonFormData) => {
    clearError()

    if (!federationId) {
      return
    }

    try {
      const payload = {
        federationId,
        name: data.name,
        startYear: data.startYear,
        endYear: data.endYear,
        seasonStartDate: dateToISOString(data.seasonStartDate)!,
        seasonEndDate: dateToISOString(data.seasonEndDate)!,
        firstRegistrationStartDate: dateToISOString(data.firstRegistrationStartDate),
        firstRegistrationEndDate: dateToISOString(data.firstRegistrationEndDate),
        secondRegistrationStartDate: dateToISOString(data.secondRegistrationStartDate),
        secondRegistrationEndDate: dateToISOString(data.secondRegistrationEndDate),
        maxAgeGroupsPerPlayer: data.maxAgeGroupsPerPlayer,
        status: data.status,
      }

      if (isEditing) {
        await updateSeason(season.id, payload)
      } else {
        await createSeason(payload)
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <CalendarIcon className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Season' : 'Create New Season'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update season information and registration periods'
            : 'Create a new federation season with registration periods and age groups'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className='space-y-6'>
          {/* Year Fields */}
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='startYear'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Year</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min={2000}
                      max={2100}
                      placeholder='2024'
                      disabled={isSubmitting}
                      onChange={(e) => handleStartYearChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='endYear'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Year</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      disabled={true}
                      className='bg-muted'
                      placeholder='2025'
                    />
                  </FormControl>
                  <FormDescription>Auto-calculated (start year + 1)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Name Field */}
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Season Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='e.g., 2024-2025 Season'
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Auto-generated from years, but can be customized
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Season Dates */}
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='seasonStartDate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Season Start Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder='Pick start date'
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='seasonEndDate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Season End Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder='Pick end date'
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* First Registration Period */}
          <Collapsible open={firstPeriodOpen} onOpenChange={setFirstPeriodOpen}>
            <CollapsibleTrigger asChild>
              <Button variant='outline' className='flex w-full justify-between' type='button'>
                <span>First Registration Period {!firstPeriodOpen && '(Optional)'}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${firstPeriodOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className='mt-4 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='firstRegistrationStartDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ?? undefined}
                          onDateChange={field.onChange}
                          placeholder='Pick start date'
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='firstRegistrationEndDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ?? undefined}
                          onDateChange={field.onChange}
                          placeholder='Pick end date'
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Second Registration Period */}
          <Collapsible open={secondPeriodOpen} onOpenChange={setSecondPeriodOpen}>
            <CollapsibleTrigger asChild>
              <Button variant='outline' className='flex w-full justify-between' type='button'>
                <span>Second Registration Period {!secondPeriodOpen && '(Optional)'}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${secondPeriodOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className='mt-4 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='secondRegistrationStartDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ?? undefined}
                          onDateChange={field.onChange}
                          placeholder='Pick start date'
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='secondRegistrationEndDate'
                  render={({ field }) => (
                    <FormItem className='flex flex-col'>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value ?? undefined}
                          onDateChange={field.onChange}
                          placeholder='Pick end date'
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Configuration Fields */}
          <div className='grid grid-cols-2 gap-4'>
            <FormField
              control={form.control}
              name='maxAgeGroupsPerPlayer'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Age Groups Per Player</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min={1}
                      placeholder='1'
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>How many age groups can a player register for</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='draft'>Draft</SelectItem>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='closed'>Closed</SelectItem>
                      <SelectItem value='archived'>Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Season status for registration availability</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
              {isEditing ? 'Update Season' : 'Create Season'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default SeasonForm
