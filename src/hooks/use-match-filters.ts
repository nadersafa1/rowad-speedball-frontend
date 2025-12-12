'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { Match, Group, EventFormat } from '@/types'

export type MatchStatus = 'all' | 'upcoming' | 'live' | 'played'

export interface MatchFilters {
  groupFilter: string
  statusFilter: MatchStatus
  roundFilter: number | 'all'
  playerSearch: string
  dateFrom: string | null
  dateTo: string | null
}

/**
 * Hook for managing match filters with URL state persistence.
 */
export const useMatchFilters = (
  matches: Match[],
  groups: Group[],
  eventFormat?: EventFormat,
  liveMatchIds?: Set<string>
) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isUpdatingRef = useRef(false)

  // Get initial values from URL or defaults
  const getInitialFilters = (): MatchFilters => ({
    groupFilter: searchParams.get('group') || 'all',
    statusFilter: (searchParams.get('status') as MatchStatus) || 'all',
    roundFilter: searchParams.get('round')
      ? Number(searchParams.get('round'))
      : 'all',
    playerSearch: searchParams.get('search') || '',
    dateFrom: searchParams.get('dateFrom') || null,
    dateTo: searchParams.get('dateTo') || null,
  })

  const [filters, setFilters] = useState<MatchFilters>(getInitialFilters)

  // Sync filters from URL when URL changes externally (not from our updates)
  useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false
      return
    }

    const urlFilters: MatchFilters = {
      groupFilter: searchParams.get('group') || 'all',
      statusFilter: (searchParams.get('status') as MatchStatus) || 'all',
      roundFilter: searchParams.get('round')
        ? Number(searchParams.get('round'))
        : 'all',
      playerSearch: searchParams.get('search') || '',
      dateFrom: searchParams.get('dateFrom') || null,
      dateTo: searchParams.get('dateTo') || null,
    }

    setFilters((currentFilters) => {
      // Check if URL filters differ from current filters
      const hasChanged =
        urlFilters.groupFilter !== currentFilters.groupFilter ||
        urlFilters.statusFilter !== currentFilters.statusFilter ||
        urlFilters.roundFilter !== currentFilters.roundFilter ||
        urlFilters.playerSearch !== currentFilters.playerSearch ||
        urlFilters.dateFrom !== currentFilters.dateFrom ||
        urlFilters.dateTo !== currentFilters.dateTo

      return hasChanged ? urlFilters : currentFilters
    })
  }, [searchParams])

  // Update URL when filters change
  useEffect(() => {
    isUpdatingRef.current = true

    // Create new params object preserving all existing params
    const params = new URLSearchParams(searchParams.toString())

    // Update or remove filter params based on filter values
    if (filters.groupFilter !== 'all') {
      params.set('group', filters.groupFilter)
    } else {
      params.delete('group')
    }

    if (filters.statusFilter !== 'all') {
      params.set('status', filters.statusFilter)
    } else {
      params.delete('status')
    }

    if (filters.roundFilter !== 'all') {
      params.set('round', String(filters.roundFilter))
    } else {
      params.delete('round')
    }

    if (filters.playerSearch) {
      params.set('search', filters.playerSearch)
    } else {
      params.delete('search')
    }

    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom)
    } else {
      params.delete('dateFrom')
    }

    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo)
    } else {
      params.delete('dateTo')
    }

    // Build new URL preserving all params (including non-filter params like 'tab')
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname

    // Only update if URL actually changed to avoid infinite loops
    const currentUrl = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [filters, router, pathname])

  // Get available rounds from matches
  const availableRounds = useMemo(() => {
    const rounds = new Set<number>()
    matches.forEach((m) => rounds.add(m.round))
    return Array.from(rounds).sort((a, b) => a - b)
  }, [matches])

  const updateFilter = <K extends keyof MatchFilters>(
    key: K,
    value: MatchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      groupFilter: 'all',
      statusFilter: 'all',
      roundFilter: 'all',
      playerSearch: '',
      dateFrom: null,
      dateTo: null,
    })
  }

  return {
    filters,
    updateFilter,
    resetFilters,
    availableRounds,
  }
}
