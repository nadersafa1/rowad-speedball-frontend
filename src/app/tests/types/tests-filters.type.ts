interface TestsFilters {
  q?: string
  playingTime?: number
  recoveryTime?: number
  dateFrom?: string
  dateTo?: string
  organizationId?: string | null
  sortBy?: 'name' | 'dateConducted' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export type { TestsFilters }
