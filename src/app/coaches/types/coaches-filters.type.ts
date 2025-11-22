import { Gender } from './enums'

interface CoachesFilters {
  q?: string
  gender?: Gender
  page?: number
  limit?: number
  sortBy?: 'name' | 'gender' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export type { CoachesFilters }

