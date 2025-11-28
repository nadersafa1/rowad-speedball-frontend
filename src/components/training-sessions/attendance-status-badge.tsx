'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus
  className?: string
}

const statusConfig: Record<
  AttendanceStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
> = {
  pending: {
    label: 'Pending',
    variant: 'outline',
    className: 'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
  },
  present: {
    label: 'Present',
    variant: 'default',
    className: 'border-green-500/50 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/20',
  },
  late: {
    label: 'Late',
    variant: 'outline',
    className: 'border-orange-500/50 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20',
  },
  absent_excused: {
    label: 'Absent (Excused)',
    variant: 'outline',
    className: 'border-blue-500/50 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20',
  },
  absent_unexcused: {
    label: 'Absent (Unexcused)',
    variant: 'destructive',
    className: 'border-red-500/50 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20',
  },
  suspended: {
    label: 'Suspended',
    variant: 'outline',
    className: 'border-gray-500/50 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/20',
  },
}

export const AttendanceStatusBadge = ({
  status,
  className,
}: AttendanceStatusBadgeProps) => {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

