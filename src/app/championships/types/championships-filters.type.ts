interface ChampionshipsFilters {
  q?: string
  federationId?: string
  competitionScope?: 'clubs' | 'open'
  page?: number
  limit?: number
  sortBy?: 'name' | 'competitionScope' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export type { ChampionshipsFilters }
