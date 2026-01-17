'use client'

import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { TestDateRangePicker } from '@/components/tests/test-date-range-picker'
import { type DateRange } from 'react-day-picker'
import { Intensity, AgeGroup, SessionType } from '../types/enums'
import { Table } from '@tanstack/react-table'
import { TrainingSession, Coach } from '@/db/schema'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

interface TrainingSessionsTableControlsProps {
  table: Table<TrainingSessionWithCoaches>
  searchValue: string
  onSearchChange?: (value: string) => void
  intensity?: Intensity
  type?: string
  dateRange?: DateRange | undefined
  ageGroup?: AgeGroup
  organizationId?: string | null
  isSystemAdmin?: boolean
  onIntensityChange?: (intensity: Intensity) => void
  onTypeChange?: (type?: string) => void
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  onAgeGroupChange?: (ageGroup?: AgeGroup) => void
  onOrganizationChange?: (organizationId?: string | null) => void
}

export const TrainingSessionsTableControls = ({
  table,
  searchValue,
  onSearchChange,
  intensity = Intensity.ALL,
  type,
  dateRange,
  ageGroup,
  organizationId,
  isSystemAdmin = false,
  onIntensityChange,
  onTypeChange,
  onDateRangeChange,
  onAgeGroupChange,
  onOrganizationChange,
}: TrainingSessionsTableControlsProps) => {
  const [organizations, setOrganizations] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)

  useEffect(() => {
    if (isSystemAdmin) {
      const fetchOrganizations = async () => {
        setIsLoadingOrgs(true)
        try {
          const response = await apiClient.getOrganizations()
          setOrganizations(response.data.map((org) => ({ id: org.id, name: org.name })))
        } catch (error) {
          console.error('Failed to fetch organizations:', error)
        } finally {
          setIsLoadingOrgs(false)
        }
      }
      fetchOrganizations()
    }
  }, [isSystemAdmin])

  const sessionTypeLabels: Record<string, string> = {
    [SessionType.SINGLES]: 'Singles',
    [SessionType.MEN_DOUBLES]: 'Men Doubles',
    [SessionType.WOMEN_DOUBLES]: 'Women Doubles',
    [SessionType.MIXED_DOUBLES]: 'Mixed Doubles',
    [SessionType.SOLO]: 'Solo',
    [SessionType.RELAY]: 'Relay',
  }

  const ageGroupLabels: Record<string, string> = {
    [AgeGroup.MINI]: 'Mini',
    [AgeGroup.U_09]: 'U-09',
    [AgeGroup.U_11]: 'U-11',
    [AgeGroup.U_13]: 'U-13',
    [AgeGroup.U_15]: 'U-15',
    [AgeGroup.U_17]: 'U-17',
    [AgeGroup.U_19]: 'U-19',
    [AgeGroup.U_21]: 'U-21',
    [AgeGroup.SENIORS]: 'Seniors',
  }

  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      intensity: 'Intensity',
      type: 'Type',
      date: 'Date',
      ageGroups: 'Age Groups',
      coaches: 'Coaches',
      organizationName: 'Club',
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
            placeholder='Search training sessions...'
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

      {/* Row 2: Filters */}
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Intensity Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='intensity' className='block mb-2'>
            Intensity
          </Label>
          <Select
            name='intensity'
            value={intensity}
            onValueChange={(value) =>
              onIntensityChange?.(value as Intensity)
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Intensity' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Intensity.ALL}>All Intensities</SelectItem>
              <SelectItem value={Intensity.HIGH}>High</SelectItem>
              <SelectItem value={Intensity.NORMAL}>Normal</SelectItem>
              <SelectItem value={Intensity.LOW}>Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='type' className='block mb-2'>
            Type
          </Label>
          <Select
            name='type'
            value={type || 'all'}
            onValueChange={(value) =>
              onTypeChange?.(value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              {Object.entries(sessionTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='dateRange' className='block mb-2'>
            Date Range
          </Label>
          <TestDateRangePicker
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            placeholder='Pick a date range'
          />
        </div>

        {/* Age Group Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='ageGroup' className='block mb-2'>
            Age Group
          </Label>
          <Select
            name='ageGroup'
            value={ageGroup || AgeGroup.ALL}
            onValueChange={(value) =>
              onAgeGroupChange?.(
                value === AgeGroup.ALL ? undefined : (value as AgeGroup)
              )
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Age Group' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AgeGroup.ALL}>All Age Groups</SelectItem>
              {Object.entries(ageGroupLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
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
                  placeholder={
                    isLoadingOrgs ? 'Loading...' : 'Select a Club'
                  }
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

