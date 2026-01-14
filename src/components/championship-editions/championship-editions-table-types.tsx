import type { ChampionshipEdition } from '@/db/schema'

export interface ChampionshipEditionWithRelations extends ChampionshipEdition {
  championshipName: string | null
  championshipCompetitionScope: 'clubs' | 'open' | null
  federationId: string | null
  federationName: string | null
}

export interface ChampionshipEditionsTableProps {
  editions: ChampionshipEditionWithRelations[]
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
  championshipId?: string
  statusFilter?: 'draft' | 'published' | 'archived' | 'all'
  onStatusChange?: (status: 'draft' | 'published' | 'archived' | 'all') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
}
