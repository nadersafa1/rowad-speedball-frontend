'use client'

import { ShieldAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface UnauthorizedAccessProps {
  title?: string
  message?: string
  requiredRole?: string
  showBackButton?: boolean
}

/**
 * UnauthorizedAccess Component
 *
 * Displays a user-friendly message when a user attempts to access
 * a protected resource without proper authorization.
 *
 * @param title - Custom title (default: "Access Denied")
 * @param message - Custom message explaining the restriction
 * @param requiredRole - The role required to access this resource
 * @param showBackButton - Whether to show a back button (default: true)
 */
export function UnauthorizedAccess({
  title = 'Access Denied',
  message = 'You do not have permission to access this resource.',
  requiredRole,
  showBackButton = true,
}: UnauthorizedAccessProps) {
  const router = useRouter()

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Card className='max-w-md w-full border-amber-200 dark:border-amber-900'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20'>
              <ShieldAlert className='h-8 w-8 text-amber-600 dark:text-amber-500' />
            </div>
            <CardTitle className='text-2xl font-bold text-amber-900 dark:text-amber-100'>
              {title}
            </CardTitle>
            <CardDescription className='text-base mt-2'>
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {requiredRole && (
              <div className='rounded-lg bg-amber-50 dark:bg-amber-900/10 p-4 border border-amber-200 dark:border-amber-800'>
                <p className='text-sm text-amber-900 dark:text-amber-100'>
                  <span className='font-semibold'>Required Role:</span> {requiredRole}
                </p>
              </div>
            )}
            {showBackButton && (
              <div className='flex flex-col sm:flex-row gap-2'>
                <Button
                  onClick={() => router.back()}
                  variant='outline'
                  className='flex-1'
                >
                  Go Back
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  className='flex-1'
                >
                  Go to Home
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
