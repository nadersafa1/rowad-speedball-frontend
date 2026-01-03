'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { LoadingButton } from '@/components/forms/loading-button'
import { Button } from '@/components/ui/button'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { formatDateForAPI } from '@/lib/date-utils'

const formSchema = z
  .object({
    championshipId: z.string().uuid('Invalid championship ID'),
    year: z
      .number()
      .int('Year must be an integer')
      .min(2000, 'Year must be 2000 or later')
      .max(2100, 'Year must be 2100 or earlier'),
    status: z.enum(['draft', 'published', 'archived']),
    registrationStartDate: z.date().optional(),
    registrationEndDate: z.date().optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, end date must be after start date
      if (data.registrationStartDate && data.registrationEndDate) {
        return data.registrationEndDate >= data.registrationStartDate
      }
      return true
    },
    {
      message: 'Registration end date must be after start date',
      path: ['registrationEndDate'],
    }
  )

type FormData = z.infer<typeof formSchema>

interface ChampionshipEditionFormProps {
  championshipId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ChampionshipEditionForm({
  championshipId,
  onSuccess,
  onCancel,
}: ChampionshipEditionFormProps) {
  const router = useRouter()
  const { createEdition, isLoading } = useChampionshipEditionsStore()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      championshipId,
      year: new Date().getFullYear(),
      status: 'draft',
      registrationStartDate: undefined,
      registrationEndDate: undefined,
    },
  })

  useEffect(() => {
    form.setValue('championshipId', championshipId)
  }, [championshipId, form])

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        championshipId: data.championshipId,
        year: data.year,
        status: data.status,
        registrationStartDate: data.registrationStartDate
          ? formatDateForAPI(data.registrationStartDate)
          : null,
        registrationEndDate: data.registrationEndDate
          ? formatDateForAPI(data.registrationEndDate)
          : null,
      }

      await createEdition(payload)
      toast.success('Championship edition created successfully')
      form.reset()
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/championships/${championshipId}`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create championship edition')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='year'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                The year for this championship edition
              </FormDescription>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='draft'>Draft</SelectItem>
                  <SelectItem value='published'>Published</SelectItem>
                  <SelectItem value='archived'>Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Draft editions are not visible to the public
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='registrationStartDate'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Start Date (Optional)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder='Pick registration start date'
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                When registration opens for this edition
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='registrationEndDate'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration End Date (Optional)</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onDateChange={field.onChange}
                  placeholder='Pick registration end date'
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                When registration closes for this edition
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex gap-4'>
          {onCancel && (
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <LoadingButton type='submit' isLoading={isLoading}>
            Create Edition
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}
