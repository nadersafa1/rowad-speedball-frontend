import { SortOrder } from '@/types'
import { AgeGroup, Gender, Team } from './enums'

interface PlayersFilters {
  q?: string
  gender?: Gender
  ageGroup?: AgeGroup
  team?: Team
  organizationId?: string | null
  page?: number
  limit?: number
  sortBy?:
    | 'name'
    | 'dateOfBirth'
    | 'createdAt'
    | 'updatedAt'
    | 'gender'
    | 'preferredHand'
    | 'teamLevel'
    | 'organizationId'
  sortOrder?: SortOrder
}

export type { PlayersFilters }
