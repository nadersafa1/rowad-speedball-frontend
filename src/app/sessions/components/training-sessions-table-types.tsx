import { SortableField } from './training-sessions-table-utils'
import { TrainingSession, Coach } from '@/db/schema'
import { type DateRange } from 'react-day-picker'
import { Intensity, AgeGroup } from '../types/enums'

export type { SortableField }

export interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

export interface TrainingSessionsTableProps {
  trainingSessions: TrainingSessionWithCoaches[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onSearchChange?: (search: string) => void
  searchValue?: string
  intensity?: Intensity
  type?: string
  dateRange?: DateRange | undefined
  ageGroup?: AgeGroup
  organizationId?: string | null
  onIntensityChange?: (intensity: Intensity) => void
  onTypeChange?: (type?: string) => void
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  onAgeGroupChange?: (ageGroup?: AgeGroup) => void
  onOrganizationChange?: (organizationId?: string | null) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy?: SortableField, sortOrder?: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
}

