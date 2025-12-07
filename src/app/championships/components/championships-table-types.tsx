import { SortableField } from './championships-table-utils'
import type { Championship } from '@/db/schema'

interface ChampionshipWithFederation extends Championship {
  federationName: string | null
}

export interface ChampionshipsTableProps {
  championships: ChampionshipWithFederation[]
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
  federationId?: string
  onFederationChange?: (federationId?: string) => void
  sortBy?: SortableField
  sortOrder?: 'asc' | 'desc'
  onSortingChange?: (sortBy?: SortableField, sortOrder?: 'asc' | 'desc') => void
  isLoading?: boolean
  onRefetch?: () => void
}

export type { ChampionshipWithFederation }
