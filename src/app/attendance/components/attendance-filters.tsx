/**
 * Attendance Filters
 * Date range and status filters for attendance view
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'

export interface AttendanceFiltersState {
  startDate: Date | undefined
  endDate: Date | undefined
  status: string
  sessionType: string
}

interface AttendanceFiltersProps {
  filters: AttendanceFiltersState
  onFiltersChange: (filters: AttendanceFiltersState) => void
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

export function AttendanceFilters({
  filters,
  onFiltersChange,
  onReset,
}: AttendanceFiltersProps) {
  const handleDateChange = (field: 'startDate' | 'endDate', value: Date | undefined) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value,
    })
  }

  const handleSessionTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sessionType: value,
    })
  }

  const defaultDates = getDefaultDates()
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.sessionType !== 'all' ||
    filters.startDate?.getTime() !== defaultDates.startDate?.getTime() ||
    filters.endDate?.getTime() !== defaultDates.endDate?.getTime()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <DatePicker
              date={filters.startDate}
              onDateChange={(date) => handleDateChange('startDate', date)}
              placeholder="Pick start date"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date</Label>
            <DatePicker
              date={filters.endDate}
              onDateChange={(date) => handleDateChange('endDate', date)}
              placeholder="Pick end date"
            />
          </div>

          {/* Session Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="sessionType">Session Type</Label>
            <Select
              value={filters.sessionType}
              onValueChange={handleSessionTypeChange}
            >
              <SelectTrigger id="sessionType">
                <SelectValue placeholder="All Types" />
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

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent_unexcused">Absent (Unexcused)</SelectItem>
                <SelectItem value="absent_excused">Absent (Excused)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Button */}
          <div className="space-y-2">
            <Label className="invisible">Reset</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={onReset}
              disabled={!hasActiveFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
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
