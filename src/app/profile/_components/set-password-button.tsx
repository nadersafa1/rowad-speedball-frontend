'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

const SetPasswordButton = ({ email }: { email: string }) => {
  const handleSendPasswordResetEmail = async () => {
    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: '/auth/reset-password',
      },
      {
        onSuccess: () => {
          toast.success('Password reset email sent')
        },
        onError: (error) => {
          toast.error('Password reset email failed', {
            description: error.error.message,
          })
        },
      }
    )
  }

  return (
    <Button onClick={handleSendPasswordResetEmail} variant="outline">
      Send Password Reset Email
    </Button>
  )
}

export default SetPasswordButton

