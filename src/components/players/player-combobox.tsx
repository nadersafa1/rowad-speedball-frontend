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
import type { Player, PaginatedResponse } from '@/types'

interface PlayerComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  excludedPlayerIds?: string[]
  unassigned?: boolean
  organizationId?: string | null
}

const PlayerCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select player...',
  className,
  excludedPlayerIds = [],
  unassigned = false,
  organizationId,
}: PlayerComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [players, setPlayers] = React.useState<Player[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(
    null
  )

  // Debounced search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || open) {
        fetchPlayers(searchQuery.trim())
      }
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, open])

  // Fetch selected player when value changes
  React.useEffect(() => {
    if (value && !selectedPlayer) {
      fetchSelectedPlayer(value)
    } else if (!value) {
      setSelectedPlayer(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const fetchPlayers = async (query: string = '') => {
    setIsLoading(true)
    try {
      const response = (await apiClient.getPlayers({
        q: query,
        limit: 50,
        unassigned: unassigned,
        organizationId: organizationId,
      })) as PaginatedResponse<Player>

      setPlayers(response.data)

      // If we have a value, find and set the selected player
      if (value && !selectedPlayer) {
        const found = response.data.find((p) => p.id === value)
        if (found) {
          setSelectedPlayer(found)
        }
      }
    } catch (error) {
      console.error('Failed to fetch players:', error)
      setPlayers([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSelectedPlayer = async (playerId: string) => {
    try {
      const player = (await apiClient.getPlayer(playerId)) as Player
      setSelectedPlayer(player)
    } catch (error) {
      console.error('Failed to fetch selected player:', error)
    }
  }

  const formatPlayerLabel = (player: Player) => {
    const genderEmoji = player.gender === 'male' ? '👨' : '👩'
    return `${player.name} (${genderEmoji} ${player.ageGroup})`
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
            {selectedPlayer ? formatPlayerLabel(selectedPlayer) : placeholder}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          align='start'
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder='Search players...'
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
                      ? 'No players found.'
                      : 'Start typing to search...'}
                  </CommandEmpty>
                  <CommandGroup>
                    {players
                      .filter(
                        (player) =>
                          !excludedPlayerIds.includes(player.id) ||
                          player.id === value
                      )
                      .map((player) => (
                        <CommandItem
                          key={player.id}
                          value={player.id}
                          onSelect={(currentValue) => {
                            const newValue =
                              currentValue === value ? '' : currentValue
                            const player = players.find(
                              (p) => p.id === newValue
                            )
                            if (player) {
                              setSelectedPlayer(player)
                              onValueChange?.(newValue)
                            }
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value === player.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          {formatPlayerLabel(player)}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedPlayer && (
        <div className='text-sm text-gray-600 mt-1'>
          Age: {selectedPlayer.age} • Group: {selectedPlayer.ageGroup}
        </div>
      )}
    </div>
  )
}

export default PlayerCombobox
