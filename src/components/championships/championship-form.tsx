'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trophy } from 'lucide-react'
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
  FormDescription,
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
import { nameSchema, uuidSchema, descriptionSchema } from '@/lib/forms/patterns'
import { LoadingButton, FormError } from '@/components/forms'

// Validation schema using shared patterns
const championshipSchema = z.object({
  name: nameSchema,
  federationId: uuidSchema,
  description: descriptionSchema,
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
                <FormDescription>
                  The official name of the championship
                </FormDescription>
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
                  <FormDescription>
                    The federation that owns this championship
                  </FormDescription>
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
                <FormDescription>
                  Additional details about the championship
                </FormDescription>
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
                <FormDescription>
                  Clubs: Only federation member clubs can participate. Open: Anyone can participate
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
              {isEditing ? 'Update Championship' : 'Create Championship'}
            </LoadingButton>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default ChampionshipForm
