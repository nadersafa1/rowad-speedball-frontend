'use client'

import { Search, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'
import { AgeGroup } from '@/app/players/types/enums'
import { Gender } from '@/app/players/types/enums'
import { Table } from '@tanstack/react-table'
import type { AttendanceRecord } from '@/hooks/use-training-session-attendance'

interface AttendanceTableControlsProps {
  table: Table<AttendanceRecord>
  searchQuery: string
  statusFilter: AttendanceStatus | 'all'
  ageGroupFilter: string
  genderFilter: string
  onSearchChange: (query: string) => void
  onStatusFilterChange: (status: AttendanceStatus | 'all') => void
  onAgeGroupFilterChange: (ageGroup: string) => void
  onGenderFilterChange: (gender: string) => void
  onClearFilters: () => void
}

const statusFilterOptions: Array<{
  value: AttendanceStatus | 'all'
  label: string
}> = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent_excused', label: 'Absent (Excused)' },
  { value: 'absent_unexcused', label: 'Absent (Unexcused)' },
  { value: 'suspended', label: 'Suspended' },
]

const getColumnLabel = (columnId: string) => {
  const labels: Record<string, string> = {
    gender: 'Gender',
    ageGroup: 'Age Group',
  }
  return labels[columnId] || columnId
}

export const AttendanceTableControls = ({
  table,
  searchQuery,
  statusFilter,
  ageGroupFilter,
  genderFilter,
  onSearchChange,
  onStatusFilterChange,
  onAgeGroupFilterChange,
  onGenderFilterChange,
  onClearFilters,
}: AttendanceTableControlsProps) => {
  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    ageGroupFilter !== AgeGroup.ALL ||
    genderFilter !== Gender.ALL

  return (
    <div className='space-y-4'>
      {/* Row 1: Search input and Column visibility */}
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full relative'>
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder="Search by player's name..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
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
        {hasActiveFilters && (
          <Button variant='outline' onClick={onClearFilters} className='gap-2'>
            <X className='h-4 w-4' />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Row 2: Status, Gender, and Age Group filters */}
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Status Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='status' className='block mb-2'>
            Status
          </Label>
          <Select
            name='status'
            value={statusFilter}
            onValueChange={(value: AttendanceStatus | 'all') =>
              onStatusFilterChange(value)
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select status' />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
            value={genderFilter}
            onValueChange={(value: string) => onGenderFilterChange(value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select gender' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Gender.ALL}>All</SelectItem>
              <SelectItem value={Gender.MALE}>Male</SelectItem>
              <SelectItem value={Gender.FEMALE}>Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Age Group Filter */}
        <div className='flex-1 w-full md:w-auto'>
          <Label htmlFor='ageGroup' className='block mb-2'>
            Age Group
          </Label>
          <Select
            name='ageGroup'
            value={ageGroupFilter}
            onValueChange={(value: string) => onAgeGroupFilterChange(value)}
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select an Age Group' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={AgeGroup.ALL}>All Age Groups</SelectItem>
              <SelectItem value={AgeGroup.MINI}>Mini (U-07)</SelectItem>
              <SelectGroup>
                <SelectLabel>Juniors</SelectLabel>
                <SelectItem value={AgeGroup.U_09}>U-09</SelectItem>
                <SelectItem value={AgeGroup.U_11}>U-11</SelectItem>
                <SelectItem value={AgeGroup.U_13}>U-13</SelectItem>
                <SelectItem value={AgeGroup.U_15}>U-15</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Seniors</SelectLabel>
                <SelectItem value={AgeGroup.U_17}>U-17</SelectItem>
                <SelectItem value={AgeGroup.U_19}>U-19</SelectItem>
                <SelectItem value={AgeGroup.U_21}>U-21</SelectItem>
                <SelectItem value={AgeGroup.SENIORS}>Seniors</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
