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
import { X, Search } from 'lucide-react'
import type { Group } from '@/types'
import type { MatchStatus } from '@/hooks/use-match-filters'

interface MatchesFiltersProps {
  groups: Group[]
  groupFilter: string
  statusFilter: MatchStatus
  roundFilter: number | 'all'
  playerSearch: string
  availableRounds: number[]
  showGroupFilter?: boolean
  showRoundFilter?: boolean
  onGroupChange: (value: string) => void
  onStatusChange: (value: MatchStatus) => void
  onRoundChange: (value: number | 'all') => void
  onPlayerSearchChange: (value: string) => void
  onReset?: () => void
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
  roundFilter,
  playerSearch,
  availableRounds,
  showGroupFilter = true,
  showRoundFilter = false,
  onGroupChange,
  onStatusChange,
  onRoundChange,
  onPlayerSearchChange,
  onReset,
}: MatchesFiltersProps) => {
  const hasActiveFilters =
    groupFilter !== 'all' ||
    statusFilter !== 'all' ||
    roundFilter !== 'all' ||
    playerSearch !== ''

  return (
    <div className='flex flex-wrap items-center gap-3'>
      {showGroupFilter && groups.length > 0 && (
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground hidden sm:inline'>
            Group:
          </span>
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

      {showRoundFilter && availableRounds.length > 0 && (
        <div className='flex items-center gap-2'>
          <Select
            value={roundFilter === 'all' ? 'all' : String(roundFilter)}
            onValueChange={(value) =>
              onRoundChange(value === 'all' ? 'all' : Number(value))
            }
          >
            <SelectTrigger className='w-[130px] h-8'>
              <SelectValue placeholder='All Rounds' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Rounds</SelectItem>
              {availableRounds.map((round) => (
                <SelectItem key={round} value={String(round)}>
                  Round {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className='flex items-center gap-2 flex-1 min-w-[200px]'>
        <div className='relative flex-1 max-w-[300px]'>
          <Search className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search players...'
            value={playerSearch}
            onChange={(e) => onPlayerSearchChange(e.target.value)}
            className='pl-8 h-8'
          />
        </div>
      </div>

      {hasActiveFilters && onReset && (
        <Button
          variant='ghost'
          size='sm'
          onClick={onReset}
          className='h-8 gap-1'
        >
          <X className='h-4 w-4' />
          <span className='hidden sm:inline'>Clear</span>
        </Button>
      )}
    </div>
  )
}

export default MatchesFilters
