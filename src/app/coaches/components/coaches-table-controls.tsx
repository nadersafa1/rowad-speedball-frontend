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
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Table } from '@tanstack/react-table'
import { Coach } from '@/db/schema'
import { Gender } from '../types/enums'
import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

interface CoachesTableControlsProps {
  table: Table<CoachWithOrg>
  searchValue: string
  onSearchChange?: (value: string) => void
  gender?: Gender
  organizationId?: string | null
  onGenderChange?: (gender: Gender) => void
  onOrganizationChange?: (organizationId: string | null) => void
}

export const CoachesTableControls = ({
  table,
  searchValue,
  onSearchChange,
  gender,
  organizationId,
  onGenderChange,
  onOrganizationChange,
}: CoachesTableControlsProps) => {
  const [organizations, setOrganizations] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false)

  useEffect(() => {
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
  }, [])

  const getColumnLabel = (columnId: string) => {
    const labels: Record<string, string> = {
      createdAt: 'Created',
    }
    return labels[columnId] || columnId
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder="Search by coach's name..."
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className='w-full md:max-w-md pl-10'
          />
        </div>
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

      <div className='flex flex-col md:flex-row gap-4'>
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='gender' className='block mb-2'>
            Gender
          </Label>
          <Select
            name='gender'
            value={gender}
            onValueChange={(value: Gender) => onGenderChange?.(value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a Gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Gender.MALE}>Male</SelectItem>
              <SelectItem value={Gender.FEMALE}>Female</SelectItem>
              <SelectItem value={Gender.ALL}>All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='organizationId' className='block mb-2'>
            Club
          </Label>
          <Select
            name='organizationId'
            value={organizationId === null ? 'null' : organizationId || 'all'}
            onValueChange={(value: string) => {
              // Map Select component values to filter values:
              // - 'all' = show all (no filter) -> null
              // - 'null' = explicitly no organization (global) -> null
              // - otherwise = specific organization ID -> string
              if (value === 'all') {
                onOrganizationChange?.(null)
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
      </div>
    </div>
  )
}
