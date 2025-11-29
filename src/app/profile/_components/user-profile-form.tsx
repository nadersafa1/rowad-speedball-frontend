'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import type { User } from 'better-auth'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
})

type UpdateProfileSchema = z.infer<typeof updateProfileSchema>

const UserProfileForm = ({ user }: { user: User }) => {
  const router = useRouter()

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  })

  const onSubmit = async (data: UpdateProfileSchema) => {
    const promises = [
      authClient.updateUser({
        name: data.name,
      }),
    ]

    if (data.email !== user.email) {
      promises.push(
        authClient.changeEmail({
          newEmail: data.email,
          callbackURL: '/profile',
        })
      )
    }

    const results = await Promise.all(promises)

    const updateUserResult = results[0]
    const changeEmailResult = results[1] ?? { error: false }

    if (updateUserResult.error) {
      toast.error(updateUserResult.error.message || 'Failed to update profile')
    } else if (changeEmailResult.error) {
      toast.error(changeEmailResult.error.message || 'Failed to update email')
    } else {
      if (data.email !== user.email) {
        toast.success('Email update pending', {
          description: 'Please check your email for a verification link',
        })
      } else {
        toast.success('Profile updated successfully')
      }
      router.refresh()
    }
  }

  const { isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full mt-2" disabled={isSubmitting} type="submit">
          <LoadingSwap isLoading={isSubmitting}>Update Profile</LoadingSwap>
        </Button>
      </form>
    </Form>
  )
}

export default UserProfileForm

