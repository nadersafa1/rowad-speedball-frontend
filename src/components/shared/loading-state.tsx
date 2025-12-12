'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullScreen?: boolean
}

/**
 * Consistent loading state component for Events and Matches.
 * Provides standardized loading indicators.
 */
const LoadingState = ({
  message = 'Loading...',
  size = 'md',
  className,
  fullScreen = false,
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center p-8'

  return (
    <div className={cn(containerClasses, className)}>
      <div className='flex flex-col items-center gap-3'>
        <Loader2
          className={cn(
            sizeClasses[size],
            'animate-spin text-muted-foreground'
          )}
        />
        {message && <p className='text-sm text-muted-foreground'>{message}</p>}
      </div>
    </div>
  )
}

export default LoadingState
