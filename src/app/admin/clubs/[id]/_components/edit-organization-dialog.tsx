'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Pencil } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import type { Organization } from 'better-auth/plugins'

const editOrganizationSchema = z.object({
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

type EditOrganizationSchema = z.infer<typeof editOrganizationSchema>

interface EditOrganizationDialogProps {
  organization: Organization
}

export const EditOrganizationDialog = ({
  organization,
}: EditOrganizationDialogProps) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const form = useForm<EditOrganizationSchema>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
  })

  const { isSubmitting } = form.formState
  const { watch, setValue } = form
  const name = watch('name')

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: organization.name,
        slug: organization.slug,
      })
    }
  }, [isOpen, organization, form])

  useEffect(() => {
    if (name && isOpen) {
      setValue(
        'slug',
        name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
      )
    }
  }, [name, setValue, isOpen])

  const handleUpdate = async (data: EditOrganizationSchema) => {
    const res = await authClient.organization.update({
      organizationId: organization.id,
      data: {
        name: data.name,
        slug: data.slug,
      },
    })

    if (res.error) {
      toast.error(res.error.message || 'Failed to update club')
    } else {
      toast.success('Club updated successfully')
      form.reset()
      setIsOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Pencil className='h-4 w-4 mr-2' />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Club</DialogTitle>
          <DialogDescription>Update the club name and slug</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdate)}
            className='space-y-4'
          >
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
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                <LoadingSwap isLoading={isSubmitting}>Update</LoadingSwap>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
