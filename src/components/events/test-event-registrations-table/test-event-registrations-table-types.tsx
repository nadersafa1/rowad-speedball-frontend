import { Registration, Group } from '@/types'

export type SortableField =
  | 'rank'
  | 'playerName'
  | 'totalScore'
  | 'heat'
  | 'club'
  | 'positionR'
  | 'positionL'
  | 'positionF'
  | 'positionB'

export interface TestEventRegistrationsTableProps {
  registrations: Registration[]
  groups: Group[]
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
  heatId?: string | null
  clubId?: string | null
  onHeatChange?: (heatId: string | null) => void
  onClubChange?: (clubId: string | null) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy?: SortableField, sortOrder?: 'asc' | 'desc') => void
  isLoading?: boolean
}

export interface RegistrationTableRow {
  registration: Registration
  rank: number
  playerName: string
  heatName: string | null
  clubName: string | null
  totalScore: number
  positionR: number
  positionL: number
  positionF: number
  positionB: number
}

