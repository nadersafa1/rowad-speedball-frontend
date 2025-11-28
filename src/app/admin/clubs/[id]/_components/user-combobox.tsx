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
import type { PaginatedResponse } from '@/types/api/pagination'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  name: string
  email: string
  role: string | null
  organization: {
    id: string
    name: string
    role: string
  } | null
  isInMyOrganization?: boolean
}

interface UserComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  organizationId?: string
  unassignedOnly?: boolean
  excludeUserId?: string
}

export const UserCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select user...',
  className,
  organizationId,
  unassignedOnly = false,
  excludeUserId,
}: UserComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [users, setUsers] = React.useState<User[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  // Debounced search effect
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || open) {
        fetchUsers(searchQuery.trim())
      }
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, open])

  // Fetch selected user when value changes
  React.useEffect(() => {
    if (value && !selectedUser) {
      fetchSelectedUser(value)
    } else if (!value) {
      setSelectedUser(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const fetchUsers = async (query: string = '') => {
    setIsLoading(true)
    try {
      const response = (await apiClient.getUsers({
        q: query,
        limit: 50,
        unassigned: unassignedOnly,
      })) as PaginatedResponse<User>

      let filteredUsers = response.data

      // Exclude specific user if provided
      if (excludeUserId) {
        filteredUsers = filteredUsers.filter((u) => u.id !== excludeUserId)
      }

      setUsers(filteredUsers)

      // If we have a value, find and set the selected user
      if (value && !selectedUser) {
        const found = filteredUsers.find((u) => u.id === value)
        if (found) {
          setSelectedUser(found)
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSelectedUser = async (userId: string) => {
    try {
      const response = (await apiClient.getUsers({
        limit: 100,
      })) as PaginatedResponse<User>
      const found = response.data.find((u) => u.id === userId)
      if (found) {
        setSelectedUser(found)
      }
    } catch (error) {
      console.error('Failed to fetch selected user:', error)
    }
  }

  const formatUserLabel = (user: User) => {
    return `${user.name} (${user.email})`
  }

  return (
    <div className={cn('w-full', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled}
            className='w-full justify-between'
          >
            {selectedUser ? formatUserLabel(selectedUser) : placeholder}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          align='start'
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder='Search users...'
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
                      ? 'No users found.'
                      : 'Start typing to search...'}
                  </CommandEmpty>
                  <CommandGroup>
                    {users
                      .filter((user) => {
                        // Filter out users already in this organization
                        if (organizationId && user.organization) {
                          return user.organization.id !== organizationId
                        }
                        // Exclude specific user if provided
                        if (excludeUserId && user.id === excludeUserId) {
                          return false
                        }
                        return true
                      })
                      .map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.id}
                          onSelect={(currentValue) => {
                            const newValue =
                              currentValue === value ? '' : currentValue
                            const foundUser = users.find(
                              (u) => u.id === newValue
                            )
                            if (foundUser) {
                              setSelectedUser(foundUser)
                              onValueChange?.(newValue)
                            }
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              value === user.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <span>{formatUserLabel(user)}</span>
                              {user.organization && (
                                <Badge variant='outline' className='text-xs'>
                                  {user.organization.name} (
                                  {user.organization.role})
                                </Badge>
                              )}
                              {user.isInMyOrganization && (
                                <Badge variant='secondary' className='text-xs'>
                                  In your org
                                </Badge>
                              )}
                            </div>
                          </div>
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
