'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api-client'
import type { Coach } from '@/types'
import type { PaginatedResponse } from '@/types/api/pagination'

interface CoachesComboboxProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  organizationId?: string | null
}

const CoachesCombobox = ({
  value = [],
  onValueChange,
  disabled = false,
  placeholder = 'Select coaches...',
  className,
  organizationId,
}: CoachesComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [coaches, setCoaches] = React.useState<Coach[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedCoaches, setSelectedCoaches] = React.useState<Coach[]>([])

  // Fetch coaches effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || open) {
        fetchCoaches(searchQuery.trim())
      }
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, open, organizationId])

  // Clear coaches list when organizationId changes
  React.useEffect(() => {
    setCoaches([])
    setSelectedCoaches([])
  }, [organizationId])

  // Fetch selected coaches when value changes
  React.useEffect(() => {
    if (value && value.length > 0) {
      fetchSelectedCoaches(value)
    } else {
      setSelectedCoaches([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.join(',')])

  const fetchCoaches = async (query: string = '') => {
    setIsLoading(true)
    try {
      const response = (await apiClient.getCoaches({
        q: query,
        limit: 50,
        organizationId: organizationId || undefined,
      })) as PaginatedResponse<Coach>

      setCoaches(response.data)

      // Update selected coaches if we have values
      if (value && value.length > 0) {
        const found = response.data.filter((c) => value.includes(c.id))
        setSelectedCoaches((prev) => {
          const newCoaches = found.filter(
            (c) => !prev.some((p) => p.id === c.id)
          )
          return [...prev, ...newCoaches]
        })
      }
    } catch (error) {
      console.error('Failed to fetch coaches:', error)
      setCoaches([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSelectedCoaches = async (coachIds: string[]) => {
    try {
      const coachesData = await Promise.all(
        coachIds.map((id) => apiClient.getCoach(id))
      )
      setSelectedCoaches(coachesData as Coach[])
    } catch (error) {
      console.error('Failed to fetch selected coaches:', error)
    }
  }

  const handleToggleCoach = (coachId: string) => {
    const currentValue = value || []
    const newValue = currentValue.includes(coachId)
      ? currentValue.filter((id) => id !== coachId)
      : [...currentValue, coachId]
    onValueChange?.(newValue)

    // Update selected coaches
    if (currentValue.includes(coachId)) {
      setSelectedCoaches((prev) => prev.filter((c) => c.id !== coachId))
    } else {
      const coach = coaches.find((c) => c.id === coachId)
      if (coach) {
        setSelectedCoaches((prev) => [...prev, coach])
      }
    }
  }

  const handleRemoveCoach = (coachId: string) => {
    const currentValue = value || []
    const newValue = currentValue.filter((id) => id !== coachId)
    onValueChange?.(newValue)
    setSelectedCoaches((prev) => prev.filter((c) => c.id !== coachId))
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
            className='w-full justify-between min-h-[44px] h-auto'
          >
            <span className='truncate'>
              {(selectedCoaches && selectedCoaches.length > 0)
                ? `${selectedCoaches.length} coach${
                    selectedCoaches.length > 1 ? 'es' : ''
                  } selected`
                : placeholder}
            </span>
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
                    {searchQuery ? 'No coaches found.' : 'Start typing to search...'}
                  </CommandEmpty>
                  <CommandGroup>
                    {coaches.map((coach) => (
                      <CommandItem
                        key={coach.id}
                        value={coach.id}
                        onSelect={() => handleToggleCoach(coach.id)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            (value || []).includes(coach.id) ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {coach.name} ({coach.gender === 'male' ? 'M' : 'F'})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedCoaches && selectedCoaches.length > 0 && (
        <div className='flex flex-wrap gap-2 mt-2'>
          {selectedCoaches.map((coach) => (
            <Badge key={coach.id} variant='secondary' className='pr-1'>
              {coach.name}
              <button
                type='button'
                onClick={() => handleRemoveCoach(coach.id)}
                className='ml-1 rounded-full hover:bg-destructive/20 p-0.5'
                disabled={disabled}
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default CoachesCombobox

