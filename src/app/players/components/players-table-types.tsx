import { SortableField } from './players-table-utils'
import { Player, SortOrder } from '@/types'
import { Gender, AgeGroup, Team } from '../types/enums'

export interface PlayersTableProps {
  players: Player[]
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
  ageGroup?: AgeGroup
  team?: Team
  organizationId?: string | null
  onGenderChange?: (gender: Gender) => void
  onAgeGroupChange?: (ageGroup: AgeGroup) => void
  onTeamChange?: (team: Team) => void
  onOrganizationChange?: (organizationId: string | null) => void
  sortBy?: SortableField
  sortOrder?: SortOrder
  onSortingChange?: (sortBy?: string, sortOrder?: SortOrder) => void
  isLoading?: boolean
  onRefetch?: () => void
}
