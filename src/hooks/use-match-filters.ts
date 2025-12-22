'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
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

// Helper to parse filters from URL
const parseFiltersFromUrl = (searchParams: URLSearchParams): MatchFilters => ({
  groupFilter: searchParams.get('group') || 'all',
  statusFilter: (searchParams.get('status') as MatchStatus) || 'all',
  roundFilter: searchParams.get('round')
    ? Number(searchParams.get('round'))
    : 'all',
  playerSearch: searchParams.get('search') || '',
  dateFrom: searchParams.get('dateFrom') || null,
  dateTo: searchParams.get('dateTo') || null,
})

// Helper to check if filters have changed
const filtersEqual = (a: MatchFilters, b: MatchFilters): boolean =>
  a.groupFilter === b.groupFilter &&
  a.statusFilter === b.statusFilter &&
  a.roundFilter === b.roundFilter &&
  a.playerSearch === b.playerSearch &&
  a.dateFrom === b.dateFrom &&
  a.dateTo === b.dateTo

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

  // Extract searchParams string to avoid enumeration issues
  const searchParamsString = useMemo(
    () => searchParams.toString(),
    [searchParams]
  )

  const [filters, setFilters] = useState<MatchFilters>(() =>
    parseFiltersFromUrl(searchParams)
  )

  // Sync filters from URL when URL changes externally (not from our updates)
  useEffect(() => {
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false
      return
    }

    const urlFilters = parseFiltersFromUrl(searchParams)

    setFilters((currentFilters) =>
      filtersEqual(urlFilters, currentFilters) ? currentFilters : urlFilters
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString])

  // Update URL when filters change
  useEffect(() => {
    isUpdatingRef.current = true

    const params = new URLSearchParams(searchParams.toString())

    // Map filter keys to URL param names and default values
    const filterMap: Array<{
      key: keyof MatchFilters
      param: string
      defaultValue: string | 'all' | null
    }> = [
      { key: 'groupFilter', param: 'group', defaultValue: 'all' },
      { key: 'statusFilter', param: 'status', defaultValue: 'all' },
      { key: 'roundFilter', param: 'round', defaultValue: 'all' },
      { key: 'playerSearch', param: 'search', defaultValue: '' },
      { key: 'dateFrom', param: 'dateFrom', defaultValue: null },
      { key: 'dateTo', param: 'dateTo', defaultValue: null },
    ]

    // Update or remove filter params
    filterMap.forEach(({ key, param, defaultValue }) => {
      const value = filters[key]
      if (value !== defaultValue && value !== null && value !== '') {
        params.set(param, String(value))
      } else {
        params.delete(param)
      }
    })

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname

    const currentUrl = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`

    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, router, pathname, searchParamsString])

  // Get available rounds from matches
  const availableRounds = useMemo(() => {
    const rounds = new Set<number>()
    matches.forEach((m) => rounds.add(m.round))
    return Array.from(rounds).sort((a, b) => a - b)
  }, [matches])

  const updateFilter = useCallback(
    <K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const resetFilters = useCallback(() => {
    setFilters({
      groupFilter: 'all',
      statusFilter: 'all',
      roundFilter: 'all',
      playerSearch: '',
      dateFrom: null,
      dateTo: null,
    })
  }, [])

  return {
    filters,
    updateFilter,
    resetFilters,
    availableRounds,
  }
}
