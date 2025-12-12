'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/**
 * Consistent empty state component for Events and Matches.
 * Provides standardized messaging and optional actions.
 */
const EmptyState = ({
  icon: Icon,
  title = 'No items found',
  description,
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div className={cn('rounded-lg border p-6 sm:p-8 text-center', className)}>
      {Icon && (
        <div className='flex justify-center mb-4'>
          <Icon className='h-12 w-12 text-muted-foreground' />
        </div>
      )}
      <h3 className='text-base sm:text-lg font-semibold text-foreground mb-2'>
        {title}
      </h3>
      {description && (
        <p className='text-sm text-muted-foreground mb-4 max-w-md mx-auto'>
          {description}
        </p>
      )}
      {action && <div className='mt-4'>{action}</div>}
    </div>
  )
}

export default EmptyState
