'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { MatchSocketStatus } from '../_hooks/use-match-socket'

interface LoadingStateProps {
  status: MatchSocketStatus
  error: string | null
}

export const LoadingState = ({ status, error }: LoadingStateProps) => {
  const router = useRouter()

  if (error) {
    return (
      <div className='container mx-auto p-4'>
        <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
          <AlertCircle className='h-12 w-12 text-red-500' />
          <p className='text-red-500 text-center'>
            Failed to connect to server
          </p>
          <p className='text-sm text-muted-foreground text-center'>{error}</p>
          <Button onClick={() => router.back()} variant='outline'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const getMessage = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to server...'
      case 'loading':
        return 'Loading match...'
      default:
        return 'Loading...'
    }
  }

  return (
    <div className='container mx-auto p-4'>
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <p className='text-muted-foreground'>{getMessage()}</p>
      </div>
    </div>
  )
}

export const AccessDeniedState = () => {
  const router = useRouter()

  return (
    <div className='container mx-auto p-4'>
      <Card>
        <CardContent className='pt-6'>
          <p className='text-center text-muted-foreground'>
            You do not have permission to view this match
          </p>
          <div className='mt-4 flex justify-center'>
            <Button onClick={() => router.push('/events')} variant='outline'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Events
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

