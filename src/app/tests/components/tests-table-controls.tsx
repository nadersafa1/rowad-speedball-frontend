import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { TestDateRangePicker } from '@/components/tests/test-date-range-picker'
import { type DateRange } from 'react-day-picker'
import { TestType, TEST_TYPE_CONFIG } from '../types/enums'

interface TestsTableControlsProps {
  searchValue: string
  onSearchChange?: (value: string) => void
  testType?: {
    playingTime: number
    recoveryTime: number
  }
  dateRange?: DateRange | undefined
  organizationId?: string | null
  isSystemAdmin?: boolean
  onTestTypeChange?: (testType?: {
    playingTime: number
    recoveryTime: number
  }) => void
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  onOrganizationChange?: (organizationId?: string | null) => void
}

export const TestsTableControls = ({
  searchValue,
  onSearchChange,
  testType,
  dateRange,
  organizationId,
  isSystemAdmin = false,
  onTestTypeChange,
  onDateRangeChange,
  onOrganizationChange,
}: TestsTableControlsProps) => {
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

  const getTestTypeValue = () => {
    if (!testType) return 'all'
    const { playingTime, recoveryTime } = testType
    if (playingTime === 60 && recoveryTime === 30) return 'super-solo'
    if (playingTime === 30 && recoveryTime === 30) return 'juniors-solo'
    if (playingTime === 30 && recoveryTime === 60) return 'speed-solo'
    return 'all'
  }

  const handleTestTypeChange = (value: string) => {
    if (value === 'all') {
      onTestTypeChange?.(undefined)
      return
    }

    let playingTime: number
    let recoveryTime: number

    switch (value) {
      case 'super-solo':
        playingTime = 60
        recoveryTime = 30
        break
      case 'juniors-solo':
        playingTime = 30
        recoveryTime = 30
        break
      case 'speed-solo':
        playingTime = 30
        recoveryTime = 60
        break
      default:
        onTestTypeChange?.(undefined)
        return
    }

    onTestTypeChange?.({ playingTime, recoveryTime })
  }

  return (
    <div className='space-y-4'>
      {/* Row 1: Search input */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search tests...'
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className='w-full md:max-w-md pl-10'
          />
        </div>
      </div>

      {/* Row 2: Test Type, Date Range, and Club Filters */}
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Test Type Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='testType' className='block mb-2'>
            Test Type
          </Label>
          <Select
            name='testType'
            value={getTestTypeValue()}
            onValueChange={handleTestTypeChange}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select Test Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='super-solo'>
                Super Solo (60s/30s)
              </SelectItem>
              <SelectItem value='juniors-solo'>
                Juniors Solo (30s/30s)
              </SelectItem>
              <SelectItem value='speed-solo'>
                Speed Solo (30s/60s)
              </SelectItem>
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

