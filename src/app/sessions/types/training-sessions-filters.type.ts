import { Intensity, AgeGroup } from './enums'

interface TrainingSessionsFilters {
  q?: string
  intensity?: Intensity
  type?: string
  dateFrom?: string
  dateTo?: string
  ageGroup?: AgeGroup
  organizationId?: string | null
  page?: number
  limit?: number
  sortBy?: 'name' | 'intensity' | 'date' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export type { TrainingSessionsFilters }

