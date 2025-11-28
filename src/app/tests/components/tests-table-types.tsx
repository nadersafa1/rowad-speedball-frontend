import { Test } from '@/types'
import { type DateRange } from 'react-day-picker'

type SortableField = 'name' | 'dateConducted' | 'createdAt' | 'updatedAt'

export interface TestsTableProps {
  tests: Test[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (value: string) => void
  searchValue?: string
  testType?: {
    playingTime: number
    recoveryTime: number
  }
  dateRange?: DateRange | undefined
  organizationId?: string | null
  onTestTypeChange?: (testType?: {
    playingTime: number
    recoveryTime: number
  }) => void
  onDateRangeChange?: (dateRange?: DateRange | undefined) => void
  onOrganizationChange?: (organizationId?: string | null) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (
    sortBy?: SortableField,
    sortOrder?: 'asc' | 'desc'
  ) => void
  isLoading?: boolean
  onRefetch?: () => void
}

export type { SortableField }

