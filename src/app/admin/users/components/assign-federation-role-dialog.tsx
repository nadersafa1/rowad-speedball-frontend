'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Button } from '@/components/ui/button'
import { FederationCombobox } from '@/components/federations/federation-combobox'
import { useUsersStore } from '@/store/users-store'
import { useRoles } from '@/hooks/authorization/use-roles'
import { useFederation } from '@/hooks/authorization/use-federation'
import { toast } from 'sonner'
import type { UsersGetData } from '@/types/api/users.schemas'
import { LoadingButton } from '@/components/forms/loading-button'

const formSchema = z
  .object({
    role: z.enum(['none', 'federation-admin', 'federation-editor']),
    federationId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'none') return true
      return !!data.federationId
    },
    {
      message: 'Federation is required when assigning a federation role',
      path: ['federationId'],
    }
  )

type FormValues = z.infer<typeof formSchema>

interface AssignFederationRoleDialogProps {
  user: UsersGetData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssignFederationRoleDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: AssignFederationRoleDialogProps) {
  const { isSystemAdmin } = useRoles()
  const { federationId: userFederationId, isFederationAdmin } = useFederation()
  const { updateUserFederationRole, isLoading } = useUsersStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: user.role
        ? (user.role as 'federation-admin' | 'federation-editor')
        : 'none',
      federationId: user.federationId || undefined,
    },
  })

  const selectedRole = form.watch('role')

  // Federation admins can only assign federation-editor role
  const canAssignFederationAdmin = isSystemAdmin

  // Reset form when user changes
  useEffect(() => {
    if (open) {
      form.reset({
        role: user.role
          ? (user.role as 'federation-admin' | 'federation-editor')
          : 'none',
        federationId: user.federationId || undefined,
      })
    }
  }, [user, open, form])

  // If federation admin, pre-set their federation
  useEffect(() => {
    if (isFederationAdmin && userFederationId && selectedRole !== 'none') {
      form.setValue('federationId', userFederationId)
    }
  }, [isFederationAdmin, userFederationId, selectedRole, form])

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      const data = {
        role: values.role === 'none' ? null : values.role,
        federationId:
          values.role === 'none' ? null : values.federationId || null,
      }

      await updateUserFederationRole(user.id, data)

      toast.success('Federation role updated successfully')
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update federation role'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Assign Federation Role</DialogTitle>
          <DialogDescription>
            Manage federation-level roles for {user.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a role' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>None</SelectItem>
                      {canAssignFederationAdmin && (
                        <SelectItem value='federation-admin'>
                          Federation Admin
                        </SelectItem>
                      )}
                      <SelectItem value='federation-editor'>
                        Federation Editor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isFederationAdmin
                      ? 'You can only assign Federation Editor role'
                      : 'Select the federation-level role for this user'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole !== 'none' && (
              <FormField
                control={form.control}
                name='federationId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Federation</FormLabel>
                    <FormControl>
                      <FederationCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isFederationAdmin} // Federation admins can only assign within their federation
                        placeholder='Select federation...'
                      />
                    </FormControl>
                    {isFederationAdmin && (
                      <FormDescription>
                        You can only assign users to your federation
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  onCancel?.()
                  onOpenChange(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <LoadingButton type='submit' isLoading={isSubmitting}>
                Save Changes
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
