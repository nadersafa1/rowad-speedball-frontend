/**
 * Club Attendance Page
 * Shows attendance records for all players in the organization with stats, charts, and filters
 * Accessible by coaches, admins, and organization owners
 */

'use client'

import { useState, useEffect } from 'react'
import {
  AttendanceStatsCards,
  AttendanceStats,
} from '../components/attendance-stats-cards'
import {
  OrganizationAttendanceFilters,
  OrganizationAttendanceFiltersState,
  getDefaultDates,
} from './components/organization-attendance-filters'
import { PlayerStatsTable } from './components/player-stats-table'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'
import { format } from 'date-fns'

interface PlayerStat {
  playerId: string
  playerName: string
  total: number
  present: number
  absent: number
  attendanceRate: number
}

interface OrganizationAttendanceData {
  stats: AttendanceStats
  playerCount: number
  playerStats: PlayerStat[]
  organization: {
    id: string
    name: string
  }
}

export default function OrganizationAttendancePage() {
  const defaultDates = getDefaultDates()
  const [filters, setFilters] = useState<OrganizationAttendanceFiltersState>({
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    status: 'all',
    sessionType: 'all',
    playerName: '',
    gender: 'all',
    ageGroup: 'all',
    teamLevel: 'all',
  })

  const [data, setData] = useState<OrganizationAttendanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch Club Attendance data
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
      if (filters.playerName.trim() !== '') {
        params.set('playerName', filters.playerName.trim())
      }
      if (filters.gender !== 'all') {
        params.set('gender', filters.gender)
      }
      if (filters.ageGroup !== 'all') {
        params.set('ageGroup', filters.ageGroup)
      }
      if (filters.teamLevel !== 'all') {
        params.set('teamLevel', filters.teamLevel)
      }

      const response = await fetch(`/api/v1/attendance/club?${params}`)

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to view Club Attendance')
        }
        throw new Error('Failed to fetch attendance data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching Club Attendance:', err)
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
      playerName: '',
      gender: 'all',
      ageGroup: 'all',
      teamLevel: 'all',
    })
  }

  return (
    <div className='container mx-auto py-8 px-4 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Club Attendance</h1>
          {data?.organization && (
            <div className='flex items-center gap-4 mt-2 text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <Building2 className='h-4 w-4' />
                <span>{data.organization.name}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4' />
                <span>{data.playerCount} Players</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <OrganizationAttendanceFilters
        filters={filters}
        onFiltersChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Error State */}
      {error && (
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-destructive'>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <AttendanceStatsCards
        stats={
          data?.stats || {
            total: 0,
            present: 0,
            absent: 0,
            excused: 0,
            pending: 0,
          }
        }
        isLoading={isLoading}
      />

      {/* Player Statistics Table */}
      <PlayerStatsTable
        playerStats={data?.playerStats || []}
        isLoading={isLoading}
      />
    </div>
  )
}
