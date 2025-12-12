'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type MatchStatus = 'played' | 'live' | 'upcoming'

interface MatchStatusBadgeProps {
  status: MatchStatus
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Semantic badge component for match status.
 * Provides consistent styling across all match displays.
 */
const MatchStatusBadge = ({
  status,
  size = 'sm',
  className,
}: MatchStatusBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-2.5 py-1',
  }

  const statusConfig = {
    played: {
      label: 'Done',
      variant: 'default' as const,
      className: 'bg-green-600 hover:bg-green-700',
    },
    live: {
      label: 'Live',
      variant: 'default' as const,
      className: 'bg-red-600 hover:bg-red-700',
    },
    upcoming: {
      label: 'Upcoming',
      variant: 'outline' as const,
      className: '',
    },
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(sizeClasses[size], config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

export default MatchStatusBadge
