'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceStatusBadge } from './attendance-status-badge'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'

interface AttendanceSummaryProps {
  summary: {
    total: number
    pending: number
    present: number
    late: number
    absent_excused: number
    absent_unexcused: number
    suspended: number
  }
}

export const AttendanceSummary = ({ summary }: AttendanceSummaryProps) => {
  const stats = [
    { status: 'present' as AttendanceStatus, count: summary.present },
    { status: 'late' as AttendanceStatus, count: summary.late },
    { status: 'absent_excused' as AttendanceStatus, count: summary.absent_excused },
    { status: 'absent_unexcused' as AttendanceStatus, count: summary.absent_unexcused },
    { status: 'suspended' as AttendanceStatus, count: summary.suspended },
    { status: 'pending' as AttendanceStatus, count: summary.pending },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4'>
          {stats.map((stat) => (
            <div
              key={stat.status}
              className='flex flex-col items-center gap-2 p-3 rounded-lg border bg-card'
            >
              <div className='text-2xl font-bold'>{stat.count}</div>
              <AttendanceStatusBadge status={stat.status} />
            </div>
          ))}
        </div>
        <div className='mt-4 pt-4 border-t'>
          <div className='text-sm text-muted-foreground'>
            Total Players: <span className='font-semibold'>{summary.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

