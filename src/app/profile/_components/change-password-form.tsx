'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { LoadingSwap } from '@/components/ui/loading-swap'
import { PasswordInput } from '@/components/ui/password-input'
import { authClient } from '@/lib/auth-client'
import { passwordSignInSchema, passwordSchema } from '@/lib/forms/patterns'

const changePasswordSchema = z.object({
  currentPassword: passwordSignInSchema,
  newPassword: passwordSchema,
  revokeOtherSessions: z.boolean().optional(),
})

type ChangePasswordSchema = z.infer<typeof changePasswordSchema>

const ChangePasswordForm = () => {
  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      revokeOtherSessions: true,
    },
  })

  const onSubmit = async (data: ChangePasswordSchema) => {
    await authClient.changePassword(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: data.revokeOtherSessions ?? false,
      },
      {
        onError: (error) => {
          toast.error(error.error.message || 'Failed to change password')
        },
        onSuccess: () => {
          toast.success('Password changed successfully')
          form.reset()
        },
      }
    )
  }

  const { isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="revokeOtherSessions"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Log out other sessions</FormLabel>
            </FormItem>
          )}
        />
        <Button className="w-full mt-2" disabled={isSubmitting} type="submit">
          <LoadingSwap isLoading={isSubmitting}>Change Password</LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}

export default ChangePasswordForm

