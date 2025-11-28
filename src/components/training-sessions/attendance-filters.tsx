'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'

interface AttendanceFiltersProps {
  searchQuery: string
  statusFilter: AttendanceStatus | 'all'
  onSearchChange: (query: string) => void
  onStatusFilterChange: (status: AttendanceStatus | 'all') => void
  onClearFilters: () => void
}

const statusFilterOptions: Array<{ value: AttendanceStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent_excused', label: 'Absent (Excused)' },
  { value: 'absent_unexcused', label: 'Absent (Unexcused)' },
  { value: 'suspended', label: 'Suspended' },
]

export const AttendanceFilters = ({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onClearFilters,
}: AttendanceFiltersProps) => {
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all'

  return (
    <div className='flex flex-col sm:flex-row gap-4'>
      <div className='relative flex-1'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        <Input
          placeholder='Search by player name...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className='pl-9'
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className='w-full sm:w-[200px]'>
          <SelectValue placeholder='Filter by status' />
        </SelectTrigger>
        <SelectContent>
          {statusFilterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant='outline'
          onClick={onClearFilters}
          className='gap-2'
        >
          <X className='h-4 w-4' />
          Clear Filters
        </Button>
      )}
    </div>
  )
}

