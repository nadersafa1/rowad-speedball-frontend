'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  isWinner: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Badge component for displaying set wins/score.
 * Uses semantic colors: green for winner, red for loser.
 */
const ScoreBadge = ({
  score,
  isWinner,
  size = 'sm',
  className,
}: ScoreBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0 w-6',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1',
  }

  return (
    <Badge
      variant='default'
      className={cn(
        sizeClasses[size],
        isWinner
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-red-600 hover:bg-red-700',
        className
      )}
    >
      {score}
    </Badge>
  )
}

export default ScoreBadge
