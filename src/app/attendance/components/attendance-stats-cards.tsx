/**
 * Attendance Statistics Cards
 * Displays key attendance metrics in card format
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react'

export interface AttendanceStats {
  total: number
  present: number
  absent: number
  excused: number
  pending: number
}

interface AttendanceStatsCardsProps {
  stats: AttendanceStats
  isLoading?: boolean
}

export function AttendanceStatsCards({
  stats,
  isLoading = false,
}: AttendanceStatsCardsProps) {
  const attendanceRate =
    stats.total > 0
      ? Math.round(
          ((stats.present + stats.excused) / stats.total) * 100
        )
      : 0

  const cards = [
    {
      title: 'Total Sessions',
      value: stats.total,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Present',
      value: stats.present,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Absent',
      value: stats.absent,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Excused',
      value: stats.excused,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
