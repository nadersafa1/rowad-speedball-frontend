'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Group } from '@/types'

export type MatchStatus = 'all' | 'upcoming' | 'live' | 'played'

interface MatchesFiltersProps {
  groups: Group[]
  groupFilter: string
  statusFilter: MatchStatus
  onGroupChange: (value: string) => void
  onStatusChange: (value: MatchStatus) => void
  showGroupFilter?: boolean
}

const STATUS_OPTIONS: { value: MatchStatus; label: string }[] = [
  { value: 'all', label: 'All Matches' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'played', label: 'Played' },
]

const MatchesFilters = ({
  groups,
  groupFilter,
  statusFilter,
  onGroupChange,
  onStatusChange,
  showGroupFilter = true,
}: MatchesFiltersProps) => {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      {showGroupFilter && groups.length > 0 && (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Group:</span>
          <Select value={groupFilter} onValueChange={onGroupChange}>
            <SelectTrigger className='w-[120px] h-8'>
              <SelectValue placeholder='All Groups' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  Group {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className='flex items-center gap-2'>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className='w-[130px] h-8'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default MatchesFilters
