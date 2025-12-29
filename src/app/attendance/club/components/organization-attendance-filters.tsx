/**
 * Club Attendance Filters
 * Extended filters for organization-wide attendance view
 * Includes player name search, gender, and age group filters
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RotateCcw, Search } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'

export interface OrganizationAttendanceFiltersState {
  startDate: Date | undefined
  endDate: Date | undefined
  status: string
  sessionType: string
  playerName: string
  gender: string
  ageGroup: string
  teamLevel: string
}

interface OrganizationAttendanceFiltersProps {
  filters: OrganizationAttendanceFiltersState
  onFiltersChange: (filters: OrganizationAttendanceFiltersState) => void
  onReset: () => void
}

const SESSION_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'singles', label: 'Singles' },
  { value: 'men_doubles', label: 'Men Doubles' },
  { value: 'women_doubles', label: 'Women Doubles' },
  { value: 'mixed_doubles', label: 'Mixed Doubles' },
  { value: 'solo', label: 'Solo' },
  { value: 'relay', label: 'Relay' },
]

const GENDER_OPTIONS = [
  { value: 'all', label: 'All Genders' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const AGE_GROUP_OPTIONS = [
  { value: 'all', label: 'All Age Groups' },
  { value: 'Mini', label: 'Mini' },
  { value: 'U-09', label: 'U-09' },
  { value: 'U-11', label: 'U-11' },
  { value: 'U-13', label: 'U-13' },
  { value: 'U-15', label: 'U-15' },
  { value: 'U-17', label: 'U-17' },
  { value: 'U-19', label: 'U-19' },
  { value: 'U-21', label: 'U-21' },
  { value: 'Seniors', label: 'Seniors' },
]

const TEAM_LEVEL_OPTIONS = [
  { value: 'all', label: 'All Teams' },
  { value: 'team_a', label: 'Team A' },
  { value: 'team_b', label: 'Team B' },
  { value: 'team_c', label: 'Team C' },
]

export function OrganizationAttendanceFilters({
  filters,
  onFiltersChange,
  onReset,
}: OrganizationAttendanceFiltersProps) {
  const handleDateChange = (
    field: 'startDate' | 'endDate',
    value: Date | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const handleInputChange = (field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const defaultDates = getDefaultDates()
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.sessionType !== 'all' ||
    filters.gender !== 'all' ||
    filters.ageGroup !== 'all' ||
    filters.teamLevel !== 'all' ||
    filters.playerName.trim() !== '' ||
    filters.startDate?.getTime() !== defaultDates.startDate?.getTime() ||
    filters.endDate?.getTime() !== defaultDates.endDate?.getTime()

  return (
    <Card>
      <CardContent className='pt-6'>
        <div className='space-y-4'>
          {/* First Row: Dates and Player Search */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {/* Start Date */}
            <div className='space-y-2'>
              <Label>Start Date</Label>
              <DatePicker
                date={filters.startDate}
                onDateChange={(date) => handleDateChange('startDate', date)}
                placeholder='Pick start date'
              />
            </div>

            {/* End Date */}
            <div className='space-y-2'>
              <Label>End Date</Label>
              <DatePicker
                date={filters.endDate}
                onDateChange={(date) => handleDateChange('endDate', date)}
                placeholder='Pick end date'
              />
            </div>

            {/* Player Name Search */}
            <div className='space-y-2'>
              <Label htmlFor='playerName'>Player Name</Label>
              <div className='relative'>
                <Search className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='playerName'
                  placeholder='Search by name...'
                  value={filters.playerName}
                  onChange={(e) =>
                    handleInputChange('playerName', e.target.value)
                  }
                  className='pl-8'
                />
              </div>
            </div>
          </div>

          {/* Second Row: Dropdowns */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-6'>
            {/* Session Type */}
            <div className='space-y-2'>
              <Label htmlFor='sessionType'>Session Type</Label>
              <Select
                value={filters.sessionType}
                onValueChange={(value) =>
                  handleInputChange('sessionType', value)
                }
              >
                <SelectTrigger id='sessionType'>
                  <SelectValue placeholder='All Types' />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger id='status'>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='present'>Present</SelectItem>
                  <SelectItem value='late'>Late</SelectItem>
                  <SelectItem value='absent_unexcused'>
                    Absent (Unexcused)
                  </SelectItem>
                  <SelectItem value='absent_excused'>
                    Absent (Excused)
                  </SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='suspended'>Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gender */}
            <div className='space-y-2'>
              <Label htmlFor='gender'>Gender</Label>
              <Select
                value={filters.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
              >
                <SelectTrigger id='gender'>
                  <SelectValue placeholder='All Genders' />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Age Group */}
            <div className='space-y-2'>
              <Label htmlFor='ageGroup'>Age Group</Label>
              <Select
                value={filters.ageGroup}
                onValueChange={(value) => handleInputChange('ageGroup', value)}
              >
                <SelectTrigger id='ageGroup'>
                  <SelectValue placeholder='All Age Groups' />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Level */}
            <div className='space-y-2'>
              <Label htmlFor='teamLevel'>Team Level</Label>
              <Select
                value={filters.teamLevel}
                onValueChange={(value) => handleInputChange('teamLevel', value)}
              >
                <SelectTrigger id='teamLevel'>
                  <SelectValue placeholder='All Teams' />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            <div className='space-y-2'>
              <Label className='invisible'>Reset</Label>
              <Button
                variant='outline'
                className='w-full'
                onClick={onReset}
                disabled={!hasActiveFilters}
              >
                <RotateCcw className='h-4 w-4 mr-2' />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
export function getDefaultDates() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { startDate, endDate }
}
