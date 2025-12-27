/**
 * Attendance List
 * Displays attendance records in card format
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

export interface AttendanceRecord {
  id: string
  status:
    | 'present'
    | 'late'
    | 'absent_excused'
    | 'absent_unexcused'
    | 'pending'
    | 'suspended'
  session: {
    id: string
    name: string
    description: string | null
    date: string
    type: string[] | null
    intensity: 'high' | 'normal' | 'low' | null
    ageGroups: string[] | null
  }
}

interface AttendanceListProps {
  records: AttendanceRecord[]
  isLoading?: boolean
}

const STATUS_CONFIG = {
  present: {
    label: 'Present',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  late: {
    label: 'Late',
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  absent_excused: {
    label: 'Absent (Excused)',
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  },
  absent_unexcused: {
    label: 'Absent',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  pending: {
    label: 'Pending',
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  },
  suspended: {
    label: 'Suspended',
    variant: 'destructive' as const,
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
  },
}

export function AttendanceList({ records, isLoading = false }: AttendanceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No attendance records found</p>
            <p className="text-sm mt-2">
              Try adjusting your filters to see more results
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const statusConfig = STATUS_CONFIG[record.status]
        const sessionDate = new Date(record.session.date)

        return (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg">
                    {record.session.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(sessionDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                </div>
                <Badge className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Intensity */}
                {record.session.intensity && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Badge
                      variant={
                        record.session.intensity === 'high'
                          ? 'destructive'
                          : record.session.intensity === 'normal'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {record.session.intensity.charAt(0).toUpperCase() +
                        record.session.intensity.slice(1)}{' '}
                      Intensity
                    </Badge>
                  </div>
                )}

                {/* Session Types */}
                {record.session.type && record.session.type.length > 0 && (
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {record.session.type.map((type, index) => (
                      <Badge key={index} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Description */}
                {record.session.description && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {record.session.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
