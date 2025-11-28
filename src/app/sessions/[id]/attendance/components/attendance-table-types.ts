import { Table } from '@tanstack/react-table'
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '@/hooks/use-training-session-attendance'

export interface AttendanceTableProps {
  records: AttendanceRecord[]
  onStatusChange: (playerId: string, status: AttendanceStatus) => void
  onDelete: (playerId: string) => void
  updatingPlayerId: string | null
  isLoading?: boolean
  searchQuery?: string
  statusFilter?: AttendanceStatus | 'all'
  ageGroupFilter?: string
  genderFilter?: string
  pagination?: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSearchChange?: (query: string) => void
  onStatusFilterChange?: (status: AttendanceStatus | 'all') => void
  onAgeGroupFilterChange?: (ageGroup: string) => void
  onGenderFilterChange?: (gender: string) => void
  onClearFilters?: () => void
}

export interface AttendanceTableHandlers {
  onStatusChange: (playerId: string, status: string) => void
}
