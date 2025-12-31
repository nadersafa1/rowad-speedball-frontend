'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { apiClient } from '@/lib/api-client'
import type { Coach } from '@/types'
import type { PaginatedResponse } from '@/types/api/pagination'

interface CoachComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  excludedCoachIds?: string[]
  unassigned?: boolean
}

const CoachCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select coach...',
  className,
  excludedCoachIds = [],
  unassigned = false,
}: CoachComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [coaches, setCoaches] = React.useState<Coach[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedCoach, setSelectedCoach] = React.useState<Coach | null>(null)

  // Debounced search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || open) {
        fetchCoaches(searchQuery.trim())
      }
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, open])

  // Fetch coaches when component mounts or when value is set (for initial load)
  React.useEffect(() => {
    if (value && !selectedCoach) {
      fetchSelectedCoach(value)
    } else if (!value && !open) {
      // Fetch initial list when component is visible but not opened yet
      fetchCoaches('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Fetch selected coach when value changes
  React.useEffect(() => {
    if (value && !selectedCoach) {
      fetchSelectedCoach(value)
    } else if (!value) {
      setSelectedCoach(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const fetchCoaches = async (query: string = '') => {
    setIsLoading(true)
    try {
      const response = (await apiClient.getCoaches({
        q: query,
        limit: 50,
        unassigned: unassigned,
      })) as PaginatedResponse<Coach>

      setCoaches(response.data)

      // If we have a value, find and set the selected coach
      if (value && !selectedCoach) {
        const found = response.data.find((c) => c.id === value)
        if (found) {
          setSelectedCoach(found)
        }
      }
    } catch (error) {
      console.error('Failed to fetch coaches:', error)
      setCoaches([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSelectedCoach = async (coachId: string) => {
    try {
      const coach = (await apiClient.getCoach(coachId)) as Coach
      setSelectedCoach(coach)
    } catch (error) {
      console.error('Failed to fetch selected coach:', error)
    }
  }

  const formatCoachLabel = (coach: Coach) => {
    const genderLabel = coach.gender === 'male' ? 'M' : 'F'
    return `${coach.name} (${genderLabel})`
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled}
            className='w-full justify-between'
          >
            {selectedCoach ? formatCoachLabel(selectedCoach) : placeholder}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          align='start'
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder='Search coaches...'
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className='flex items-center justify-center py-6'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Searching...
                  </span>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {searchQuery
                      ? 'No coaches found.'
                      : 'Start typing to search...'}
                  </CommandEmpty>
                  <CommandGroup>
                    {coaches
                      .filter(
                        (coach) =>
                          !excludedCoachIds.includes(coach.id) ||
                          coach.id === value
                      )
                      .map((coach) => (
                        <CommandItem
                          key={coach.id}
                          value={coach.id}
                          onSelect={(currentValue) => {
                            const newValue =
                              currentValue === value ? '' : currentValue
                            const coach = coaches.find((c) => c.id === newValue)
                            if (coach) {
                              setSelectedCoach(coach)
                              onValueChange?.(newValue)
                            }
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value === coach.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {formatCoachLabel(coach)}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default CoachCombobox

