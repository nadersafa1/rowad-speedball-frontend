/**
 * Player Attendance Page
 * Shows player's attendance records with stats, charts, and filters
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { AttendanceStatsCards, AttendanceStats } from './components/attendance-stats-cards'
import { AttendanceCharts } from './components/attendance-charts'
import {
  AttendanceFilters,
  AttendanceFiltersState,
  getDefaultDates,
} from './components/attendance-filters'
import { AttendanceList, AttendanceRecord } from './components/attendance-list'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

interface AttendanceData {
  records: AttendanceRecord[]
  stats: AttendanceStats
  player: {
    id: string
    name: string
  }
}

export default function AttendancePage() {
  const defaultDates = getDefaultDates()
  const [filters, setFilters] = useState<AttendanceFiltersState>({
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    status: 'all',
    sessionType: 'all',
  })

  const [data, setData] = useState<AttendanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch attendance data
  const fetchAttendance = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.startDate) {
        params.set('startDate', format(filters.startDate, 'yyyy-MM-dd'))
      }
      if (filters.endDate) {
        params.set('endDate', format(filters.endDate, 'yyyy-MM-dd'))
      }
      if (filters.status !== 'all') {
        params.set('status', filters.status)
      }
      if (filters.sessionType !== 'all') {
        params.set('sessionType', filters.sessionType)
      }

      const response = await fetch(`/api/v1/players/me/attendance?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch attendance data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching attendance:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchAttendance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Reset filters to default
  const handleResetFilters = () => {
    const defaults = getDefaultDates()
    setFilters({
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      status: 'all',
      sessionType: 'all',
    })
  }

  // Calculate monthly trend data
  const monthlyData = useMemo(() => {
    if (!data?.records) return []

    const monthMap: Record<
      string,
      { present: number; absent: number; excused: number }
    > = {}

    data.records.forEach((record) => {
      const monthKey = format(parseISO(record.session.date), 'MMM yyyy')

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { present: 0, absent: 0, excused: 0 }
      }

      if (record.status === 'present' || record.status === 'late') {
        monthMap[monthKey].present++
      } else if (record.status === 'absent_unexcused') {
        monthMap[monthKey].absent++
      } else if (record.status === 'absent_excused') {
        monthMap[monthKey].excused++
      }
    })

    return Object.entries(monthMap)
      .map(([month, counts]) => ({
        month,
        ...counts,
      }))
      .sort((a, b) => {
        // Sort chronologically
        const dateA = parseISO(`01 ${a.month}`)
        const dateB = parseISO(`01 ${b.month}`)
        return dateA.getTime() - dateB.getTime()
      })
  }, [data?.records])

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Attendance</h1>
          {data?.player && (
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <User className="h-4 w-4" />
              {data.player.name}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <AttendanceFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <AttendanceStatsCards
        stats={data?.stats || { total: 0, present: 0, absent: 0, excused: 0, pending: 0 }}
        isLoading={isLoading}
      />

      {/* Charts */}
      <AttendanceCharts
        stats={data?.stats || { total: 0, present: 0, absent: 0, excused: 0, pending: 0 }}
        monthlyData={monthlyData}
        isLoading={isLoading}
      />

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceList records={data?.records || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
