'use client'

import { useEffect, useState } from 'react'
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
import { BaseCombobox } from '@/components/ui/combobox/base-combobox'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { formatDateForAPI } from '@/lib/date-utils'
import { apiClient } from '@/lib/api-client'

const formSchema = z
  .object({
    championshipId: z.uuid('Invalid championship ID'),
    status: z.enum(['draft', 'published', 'archived']),
    seasonId: z.uuid('Season is required'),
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
  federationId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ChampionshipEditionForm({
  championshipId,
  federationId,
  onSuccess,
  onCancel,
}: ChampionshipEditionFormProps) {
  const router = useRouter()
  const { createEdition, isLoading } = useChampionshipEditionsStore()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      championshipId,
      status: 'draft',
      seasonId: '',
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
        status: data.status,
        seasonId: data.seasonId,
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
          name='seasonId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Season</FormLabel>
              <FormControl>
                <BaseCombobox
                  value={field.value || undefined}
                  onChange={(value) => field.onChange(value || '')}
                  fetchItems={async (query, page, limit) => {
                    const response = await apiClient.getSeasons({
                      federationId,
                      sortBy: 'startYear',
                      sortOrder: 'desc',
                      page: page || 1,
                      limit: limit || 20,
                    })
                    return {
                      items: response.data || [],
                      hasMore: response.page < response.totalPages,
                    }
                  }}
                  formatLabel={(season: any) => season.name}
                  placeholder='Select season...'
                  searchPlaceholder='Search seasons...'
                  emptyMessage='No seasons found'
                  disabled={isLoading}
                  allowClear={false}
                />
              </FormControl>
              <FormDescription>
                Link this edition to a federation season
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
