import { Gender } from './enums'

interface CoachesFilters {
  q?: string
  gender?: Gender
  organizationId?: string | null
  unassigned?: boolean
  page?: number
  limit?: number
  sortBy?: 'name' | 'gender' | 'createdAt' | 'updatedAt' | 'organizationId'
  sortOrder?: 'asc' | 'desc'
}

export type { CoachesFilters }

