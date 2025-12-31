'use client'

import { cn } from '@/lib/utils'

interface CharacterCounterProps {
  current: number
  max: number
  className?: string
}

/**
 * CharacterCounter Component
 *
 * Displays character count with visual feedback when approaching limit.
 * Changes color to warning (yellow) at 90% and danger (red) at 100%.
 *
 * @example
 * <CharacterCounter current={description.length} max={1000} />
 *
 * @example
 * <Textarea
 *   value={field.value}
 *   onChange={field.onChange}
 *   maxLength={5000}
 * />
 * <CharacterCounter current={field.value?.length || 0} max={5000} />
 */
export const CharacterCounter = ({
  current,
  max,
  className,
}: CharacterCounterProps) => {
  const percentage = (current / max) * 100
  const isWarning = percentage >= 90
  const isDanger = percentage >= 100

  return (
    <p
      className={cn(
        'text-xs transition-colors',
        isDanger
          ? 'text-destructive font-medium'
          : isWarning
            ? 'text-yellow-600 dark:text-yellow-500'
            : 'text-muted-foreground',
        className
      )}
      aria-live='polite'
    >
      {current.toLocaleString()} / {max.toLocaleString()} characters
      {isDanger && ' (limit reached)'}
    </p>
  )
}
