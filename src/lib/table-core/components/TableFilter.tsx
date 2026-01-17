/**
 * Table Core - TableFilter Component
 * Wrapper component for consistent filter styling and layout
 */

'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface TableFilterProps {
  label?: string
  htmlFor?: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
  fullWidth?: boolean // If true, takes full width on mobile
}

export function TableFilter({
  label,
  htmlFor,
  required = false,
  error,
  className,
  children,
  fullWidth = false,
}: TableFilterProps) {
  return (
    <div
      className={cn(
        'w-full',
        fullWidth ? 'md:w-full' : 'md:w-auto',
        className
      )}
    >
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn(
            'block mb-2',
            required && "after:content-['*'] after:ml-0.5 after:text-destructive"
          )}
        >
          {label}
        </Label>
      )}
      <div className={error ? 'space-y-1' : ''}>
        {children}
        {error && (
          <p className='text-sm text-destructive' role='alert'>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
