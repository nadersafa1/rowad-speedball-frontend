'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { useChampionshipsStore } from '@/store/championships-store'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { apiClient } from '@/lib/api-client'
import type { Championship } from '@/types'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui'

// Validation schema
const championshipSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  federationId: z.uuid('Please select a federation'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  competitionScope: z.enum(['clubs', 'open']),
})

type ChampionshipFormData = z.infer<typeof championshipSchema>

interface ChampionshipFormProps {
  championship?: Championship
  onSuccess?: () => void
  onCancel?: () => void
}

const ChampionshipForm = ({
  championship,
  onSuccess,
  onCancel,
}: ChampionshipFormProps) => {
  const { createChampionship, updateChampionship, error, clearError } =
    useChampionshipsStore()
  const { context } = useOrganizationContext()
  const { isSystemAdmin, federationId: userFederationId } = context
  const isEditing = !!championship

  const [federations, setFederations] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isLoadingFederations, setIsLoadingFederations] = useState(false)

  useEffect(() => {
    const fetchFederations = async () => {
      setIsLoadingFederations(true)
      try {
        const response = (await apiClient.getFederations({ limit: 100 })) as {
          data: Array<{ id: string; name: string }>
        }
        setFederations(response.data || [])
      } catch (error) {
        console.error('Failed to fetch federations:', error)
      } finally {
        setIsLoadingFederations(false)
      }
    }
    fetchFederations()
  }, [])

  const form = useForm<ChampionshipFormData>({
    resolver: zodResolver(championshipSchema),
    defaultValues: {
      name: championship?.name || '',
      federationId: championship?.federationId || userFederationId || '',
      description: championship?.description || '',
      competitionScope: championship?.competitionScope || 'clubs',
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (data: ChampionshipFormData) => {
    clearError()
    try {
      const payload = {
        name: data.name,
        description: data.description,
        competitionScope: data.competitionScope,
      }

      if (isEditing) {
        await updateChampionship(championship.id, payload)
      } else {
        await createChampionship({
          ...payload,
          federationId: data.federationId,
        })
      }
      form.reset()
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <DialogContent className='sm:max-w-[500px]'>
      <DialogHeader>
        <DialogTitle className='flex items-center gap-2 text-lg sm:text-xl'>
          <Trophy className='h-5 w-5 text-rowad-600' />
          {isEditing ? 'Edit Championship' : 'Add New Championship'}
        </DialogTitle>
        <DialogDescription className='text-sm'>
          {isEditing
            ? 'Update championship information'
            : 'Create a new championship for a federation'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* Name Field */}
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder='Enter championship name'
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Federation Field - only for create, not edit */}
          {!isEditing && (
            <FormField
              control={form.control}
              name='federationId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Federation</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={
                      isSubmitting || isLoadingFederations || !isSystemAdmin
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingFederations
                              ? 'Loading...'
                              : 'Select a federation'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {federations.map((fed) => (
                        <SelectItem key={fed.id} value={fed.id}>
                          {fed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Description Field */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    placeholder='Enter championship description'
                    disabled={isSubmitting}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Competition Scope Field */}
          <FormField
            control={form.control}
            name='competitionScope'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Competition Scope</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select competition scope' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='clubs'>Clubs</SelectItem>
                    <SelectItem value='open'>Open</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
              {error}
            </div>
          )}

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
            <Button type='submit' disabled={isSubmitting} className='gap-2'>
              <Save className='h-4 w-4' />
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                ? 'Update Championship'
                : 'Create Championship'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default ChampionshipForm
