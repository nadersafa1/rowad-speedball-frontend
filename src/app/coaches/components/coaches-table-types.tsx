import { SortableField } from './coaches-table-utils'
import { Gender } from '../types/enums'
import { Coach } from '@/db/schema'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

export interface CoachesTableProps {
  coaches: CoachWithOrg[]
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
  gender?: Gender
  organizationId?: string | null
  onGenderChange?: (gender: Gender) => void
  onOrganizationChange?: (organizationId: string | null) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy?: SortableField, sortOrder?: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
}
