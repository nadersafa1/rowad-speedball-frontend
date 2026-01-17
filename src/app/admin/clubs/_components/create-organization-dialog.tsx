'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import z from 'zod'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { authClient } from '@/lib/auth-client'

const createOrganizationSchema = z.object({
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

type CreateOrganizationSchema = z.infer<typeof createOrganizationSchema>

interface CreateOrganizationDialogProps {
  onSuccess?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateOrganizationDialog = ({
  onSuccess,
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) => {
  const router = useRouter()
  const form = useForm<CreateOrganizationSchema>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  const { isSubmitting } = form.formState
  const { watch, setValue } = form
  const name = watch('name')

  useEffect(() => {
    if (name) {
      setValue(
        'slug',
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
    }
  }, [name, setValue])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const handleCreate = async (data: CreateOrganizationSchema) => {
    const res = await authClient.organization.create({
      name: data.name,
      slug: data.slug,
    })

    if (res.error) {
      toast.error(
        res.error instanceof Error ? res.error.message : 'Failed to create club'
      )
    } else {
      toast.success('Club created successfully')
      form.reset()
      onOpenChange(false)
      await authClient.organization.setActive({ organizationId: res.data.id })
      router.refresh()
      onSuccess?.()
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Club</DialogTitle>
        <DialogDescription>
          Create a new club and assign admins/coaches
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreate)} className='space-y-4'>
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
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              <LoadingSwap isLoading={isSubmitting}>Create</LoadingSwap>
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}
