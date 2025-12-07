interface ChampionshipsFilters {
  q?: string
  federationId?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export type { ChampionshipsFilters }
