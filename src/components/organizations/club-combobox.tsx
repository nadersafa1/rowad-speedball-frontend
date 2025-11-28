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

interface Organization {
  id: string
  name: string
  slug: string
}

interface ClubComboboxProps extends Omit<React.ComponentPropsWithoutRef<typeof Button>, 'value'> {
  value?: string | null
  onValueChange?: (value: string | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const ClubCombobox = ({
  value,
  onValueChange,
  disabled = false,
  placeholder = 'Select club...',
  className,
  ...props
}: ClubComboboxProps) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedOrg, setSelectedOrg] = React.useState<Organization | null>(
    null
  )

  // Fetch organizations list - separated from selection logic for better performance
  const fetchOrganizations = React.useCallback(async (query: string = '') => {
    setIsLoading(true)
    try {
      const orgs = await apiClient.getOrganizations()
      
      // Filter organizations by search query
      const filtered = query
        ? orgs.filter((org) =>
            org.name.toLowerCase().includes(query.toLowerCase())
          )
        : orgs

      setOrganizations(filtered)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
      setOrganizations([])
    } finally {
      setIsLoading(false)
    }
  }, []) // No dependencies - pure fetch function

  // Fetch and set selected organization based on value prop
  const fetchSelectedOrganization = React.useCallback(async (orgId: string) => {
    try {
      const orgs = await apiClient.getOrganizations()
      const found = orgs.find((org) => org.id === orgId)
      if (found) {
        setSelectedOrg(found)
      }
    } catch (error) {
      console.error('Failed to fetch selected organization:', error)
    }
  }, [])

  // Fetch organizations when popover opens (debounced by search query)
  React.useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        fetchOrganizations(searchQuery.trim())
      }, 300)

      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, open, fetchOrganizations])

  // Sync selectedOrg with value prop changes
  React.useEffect(() => {
    if (value) {
      // Only fetch if we don't already have the selected org or if it's different
      if (!selectedOrg || selectedOrg.id !== value) {
        fetchSelectedOrganization(value)
      }
    } else {
      // Clear selection when value is null/undefined
      setSelectedOrg(null)
    }
  }, [value, selectedOrg, fetchSelectedOrganization])

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
              className
            )}
            {...props}
          >
            {selectedOrg ? selectedOrg.name : placeholder}
            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-[var(--radix-popover-trigger-width)] p-0'
          align='start'
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder='Search clubs...'
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
                      ? 'No clubs found.'
                      : 'Start typing to search...'}
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value=''
                      onSelect={() => {
                        setSelectedOrg(null)
                        onValueChange?.(null)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === null || value === undefined
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      No Club (Global)
                    </CommandItem>
                    {organizations.map((org) => (
                      <CommandItem
                        key={org.id}
                        value={org.id}
                        onSelect={(currentValue) => {
                          const newValue =
                            currentValue === value ? null : currentValue
                          const organization = organizations.find(
                            (o) => o.id === newValue
                          )
                          if (organization) {
                            setSelectedOrg(organization)
                            onValueChange?.(newValue)
                          }
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === org.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {org.name}
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

export default ClubCombobox

