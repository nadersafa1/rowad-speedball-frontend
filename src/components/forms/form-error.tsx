'use client'

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormErrorProps {
  error?: string | null
  className?: string
}

/**
 * FormError Component
 *
 * Displays form-level errors in a consistent, accessible format.
 * Only renders when an error is present.
 *
 * @example
 * <FormError error={error} />
 *
 * @example
 * <FormError error="Network error occurred" className="mt-4" />
 */
export const FormError = ({ error, className }: FormErrorProps) => {
  if (!error) return null

  return (
    <div
      role='alert'
      className={cn(
        'bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2',
        className
      )}
    >
      <AlertCircle className='h-4 w-4 text-destructive mt-0.5 flex-shrink-0' />
      <p className='text-destructive text-sm flex-1'>{error}</p>
    </div>
  )
}
