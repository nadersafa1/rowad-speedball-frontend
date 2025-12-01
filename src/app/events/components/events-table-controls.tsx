import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table } from '@tanstack/react-table'
import { Event } from '@/types'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { UI_EVENT_TYPES, EVENT_TYPE_LABELS, type EventType } from '@/types/event-types'

interface EventsTableControlsProps {
  table: Table<Event>
  searchValue: string
  onSearchChange?: (value: string) => void
  eventType?: EventType
  gender?: 'male' | 'female' | 'mixed'
  organizationId?: string | null
  isSystemAdmin?: boolean
  onEventTypeChange?: (eventType?: EventType) => void
  onGenderChange?: (gender?: 'male' | 'female' | 'mixed') => void
  onOrganizationChange?: (organizationId?: string | null) => void
}

export const EventsTableControls = ({
  table,
  searchValue,
  onSearchChange,
  eventType,
  gender,
  organizationId,
  isSystemAdmin = false,
  onEventTypeChange,
  onGenderChange,
  onOrganizationChange,
}: EventsTableControlsProps) => {
  const [organizations, setOrganizations] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)

  useEffect(() => {
    if (isSystemAdmin) {
      const fetchOrganizations = async () => {
        setIsLoadingOrgs(true)
        try {
          const orgs = await apiClient.getOrganizations()
          setOrganizations(orgs)
        } catch (error) {
          console.error('Failed to fetch organizations:', error)
        } finally {
          setIsLoadingOrgs(false)
        }
      }
      fetchOrganizations()
    }
  }, [isSystemAdmin])

  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      eventType: 'Type',
      gender: 'Gender',
      completed: 'Completed',
      organizationName: 'Club',
      bestOf: 'Best Of',
      registrationsCount: 'Registrations',
      lastMatchPlayedDate: 'Last Match',
    }
    return labels[columnId] || columnId
  }

  return (
    <div className='space-y-4'>
      {/* Row 1: Search input and Column Visibility */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search events...'
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className='w-full md:max-w-md pl-10'
          />
        </div>
        {/* Column Visibility */}
        <div className='w-full md:w-auto md:ml-auto'>
          <Label className='block mb-2 md:invisible md:h-0 md:mb-0'>
            Columns
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='w-full md:w-auto'>
                Columns <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {getColumnLabel(column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Row 2: Event Type and Gender Filters */}
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Event Type Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='eventType' className='block mb-2'>
            Event Type
          </Label>
          <Select
            name='eventType'
            value={eventType || 'all'}
            onValueChange={(value) =>
              onEventTypeChange?.(
                value === 'all' ? undefined : (value as EventType)
              )
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Event Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {UI_EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EVENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='gender' className='block mb-2'>
            Gender
          </Label>
          <Select
            name='gender'
            value={gender || 'all'}
            onValueChange={(value) =>
              onGenderChange?.(
                value === 'all'
                  ? undefined
                  : (value as 'male' | 'female' | 'mixed')
              )
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Genders</SelectItem>
              <SelectItem value='male'>Male</SelectItem>
              <SelectItem value='female'>Female</SelectItem>
              <SelectItem value='mixed'>Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Club Filter - Only for System Admin */}
        {isSystemAdmin && (
          <div className='flex-1 w-full md:w-auto'>
            <Label htmlFor='club' className='block mb-2'>
              Club
            </Label>
            <Select
              name='club'
              value={organizationId === null ? 'null' : organizationId || 'all'}
              onValueChange={(value) => {
                if (value === 'all') {
                  onOrganizationChange?.(undefined)
                } else if (value === 'null') {
                  onOrganizationChange?.(null)
                } else {
                  onOrganizationChange?.(value)
                }
              }}
              disabled={isLoadingOrgs}
            >
              <SelectTrigger className='w-full'>
                <SelectValue
                  placeholder={isLoadingOrgs ? 'Loading...' : 'Select a Club'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Clubs</SelectItem>
                <SelectItem value='null'>No Club (Global)</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
