'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import z from 'zod'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { apiClient } from '@/lib/api-client'
import type { Organization } from 'better-auth/plugins'

const organizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug is too long')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    ),
})

type OrganizationSchema = z.infer<typeof organizationSchema>

interface OrganizationFormProps {
  organization?: Organization | { id: string; name: string; slug: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export const OrganizationForm = ({
  organization,
  onSuccess,
  onCancel,
}: OrganizationFormProps) => {
  const isEditing = !!organization
  const form = useForm<OrganizationSchema>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization?.name || '',
      slug: organization?.slug || '',
    },
  })

  const { isSubmitting } = form.formState
  const { watch, setValue } = form
  const name = watch('name')

  // Reset form when organization changes
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        slug: organization.slug || '',
      })
    }
  }, [organization, form])

  useEffect(() => {
    if (name && !isEditing) {
      setValue(
        'slug',
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
    }
  }, [name, setValue, isEditing])

  const handleSubmit = async (data: OrganizationSchema) => {
    try {
      if (isEditing && organization) {
        await apiClient.updateOrganization(organization.id, {
          name: data.name,
          slug: data.slug,
        })

        toast.success('Club updated successfully')
        form.reset()
        onSuccess?.()
      } else {
        // Create functionality if needed
        toast.error('Create functionality not implemented')
        return
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update club'
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Rowad Club' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='slug'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder='rowad-club' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          {onCancel && (
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type='submit' disabled={isSubmitting}>
            <LoadingSwap isLoading={isSubmitting}>
              {isEditing ? 'Update' : 'Create'}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
