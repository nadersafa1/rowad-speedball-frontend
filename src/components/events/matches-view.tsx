'use client'

import { useState, useMemo, useEffect } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List, Columns } from 'lucide-react'
import type { Match, Group, EventFormat } from '@/types'
import MatchResultsForm from './match-results-form'
import MatchesListView from './matches-list-view'
import MatchesColumnView from './matches-column-view'
import BracketStats from './bracket-stats'
import BracketVisualization from '@/components/tournaments/bracket-visualization'
import DoubleElimList from './double-elim-list'
import DoubleElimBracket from '@/components/tournaments/double-elim-bracket'
import { useMatchesSocket } from './use-matches-socket'
import { nextPowerOf2 } from '@/lib/utils/single-elimination-helpers'
import MatchesFilters from './matches-filters'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useMatchFilters, type MatchStatus } from '@/hooks/use-match-filters'
import { formatRegistrationName } from '@/lib/utils/match'
import { canPlayerUpdateMatch } from '@/hooks/authorization/use-match-permissions'

type ViewMode = 'bracket' | 'list' | 'column'

interface MatchesViewProps {
  matches: Match[]
  groups?: Group[]
  canUpdate?: boolean
  onMatchUpdate?: () => void
  eventFormat?: EventFormat
}

const MatchesView = ({
  matches,
  groups = [],
  canUpdate = false,
  onMatchUpdate,
  eventFormat,
}: MatchesViewProps) => {
  const isSingleElimination = eventFormat === 'single-elimination'
  const isDoubleElimination = eventFormat === 'double-elimination'
  const { context } = useOrganizationContext()
  const {
    isSystemAdmin,
    isAdmin,
    isOwner,
    isCoach,
    userId,
    isPlayer,
    organization,
  } = context

  // Determine if user is a privileged user (coach, admin, owner, or system admin)
  const isPrivilegedUser = isSystemAdmin || isAdmin || isOwner || isCoach

  // Function to check if a match can be updated
  // Returns true if user is privileged OR if player can update their own match
  const canUpdateMatch = (match: Match): boolean => {
    if (isPrivilegedUser && canUpdate) {
      return true
    }
    return canPlayerUpdateMatch(
      match,
      userId,
      isPlayer,
      organization?.id ?? null
    )
  }

  // Calculate default view mode based on user role and event format
  const getDefaultViewMode = (): ViewMode => {
    if (isPrivilegedUser) {
      // Coaches, admins, owners, system admins: column view for all formats
      return 'column'
    } else {
      // Players/normal users and unauthenticated users:
      // bracket view for knockouts, column view for groups
      if (isSingleElimination || isDoubleElimination) {
        return 'bracket'
      }
      return 'column'
    }
  }

  const [viewMode, setViewMode] = useState<ViewMode>(getDefaultViewMode)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const { localMatches, liveMatchIds } = useMatchesSocket(matches)

  const { filters, updateFilter, resetFilters, availableRounds } =
    useMatchFilters(localMatches, groups, eventFormat, liveMatchIds)

  // Helper to check if a match is a BYE (one registration is null)
  const isByeMatch = (match: Match): boolean => {
    const has1 = match.registration1Id !== null
    const has2 = match.registration2Id !== null
    return (has1 && !has2) || (!has1 && has2)
  }

  // Helper to check if a match has no participants (both null)
  const isEmptyMatch = (match: Match): boolean => {
    return match.registration1Id === null && match.registration2Id === null
  }

  // Filter matches based on all criteria
  const filteredMatches = useMemo(() => {
    return localMatches.filter((match) => {
      // Hide matches with no participants (both sides null)
      if ((isSingleElimination || isDoubleElimination) && isEmptyMatch(match)) {
        return false
      }

      // Hide played BYE matches in single/double elimination list view
      if (
        (isSingleElimination || isDoubleElimination) &&
        isByeMatch(match) &&
        match.played
      ) {
        return false
      }

      // Group filter
      if (
        filters.groupFilter !== 'all' &&
        match.groupId !== filters.groupFilter
      ) {
        return false
      }

      // Round filter
      if (
        filters.roundFilter !== 'all' &&
        match.round !== filters.roundFilter
      ) {
        return false
      }

      // Status filter
      if (filters.statusFilter !== 'all') {
        const isPlayed = match.played
        const isLive = !match.played && liveMatchIds.has(match.id)
        const isUpcoming = !match.played && !liveMatchIds.has(match.id)

        if (filters.statusFilter === 'played' && !isPlayed) return false
        if (filters.statusFilter === 'live' && !isLive) return false
        if (filters.statusFilter === 'upcoming' && !isUpcoming) return false
      }

      // Player search filter
      if (filters.playerSearch) {
        const searchLower = filters.playerSearch.toLowerCase()
        const player1Name = formatRegistrationName(
          match.registration1
        ).toLowerCase()
        const player2Name = formatRegistrationName(
          match.registration2
        ).toLowerCase()
        if (
          !player1Name.includes(searchLower) &&
          !player2Name.includes(searchLower)
        ) {
          return false
        }
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        if (!match.matchDate) return false
        const matchDate = new Date(match.matchDate)
        if (filters.dateFrom && matchDate < new Date(filters.dateFrom)) {
          return false
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo)
          toDate.setHours(23, 59, 59, 999) // Include entire end date
          if (matchDate > toDate) {
            return false
          }
        }
      }

      return true
    })
  }, [
    localMatches,
    filters,
    liveMatchIds,
    isSingleElimination,
    isDoubleElimination,
  ])

  // Calculate bracket stats
  const totalRounds =
    localMatches.length > 0 ? Math.max(...localMatches.map((m) => m.round)) : 0
  const uniqueRegs = new Set<string>()
  localMatches.forEach((m) => {
    if (m.registration1Id) uniqueRegs.add(m.registration1Id)
    if (m.registration2Id) uniqueRegs.add(m.registration2Id)
  })
  const bracketSize = nextPowerOf2(uniqueRegs.size)

  const handleEditMatch = (match: Match) => setSelectedMatch(match)

  useEffect(() => {
    if (viewMode === 'list' && filters.statusFilter !== 'upcoming') {
      updateFilter('statusFilter', 'upcoming')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode])

  return (
    <div className='space-y-4'>
      {/* Header with filters and view toggle */}
      {localMatches.length > 0 && (
        <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-3 pt-2'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <MatchesFilters
              groups={groups}
              groupFilter={filters.groupFilter}
              statusFilter={filters.statusFilter}
              roundFilter={filters.roundFilter}
              playerSearch={filters.playerSearch}
              availableRounds={availableRounds}
              showGroupFilter={!isSingleElimination && !isDoubleElimination}
              showRoundFilter={isSingleElimination || isDoubleElimination}
              onGroupChange={(value) => updateFilter('groupFilter', value)}
              onStatusChange={(value) => updateFilter('statusFilter', value)}
              onRoundChange={(value) => updateFilter('roundFilter', value)}
              onPlayerSearchChange={(value) =>
                updateFilter('playerSearch', value)
              }
              onReset={resetFilters}
            />
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1 p-1 bg-muted rounded-lg'>
                {(isSingleElimination || isDoubleElimination) && (
                  <Button
                    variant={viewMode === 'bracket' ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setViewMode('bracket')}
                    className='gap-1.5 h-8 px-3'
                  >
                    <LayoutGrid className='h-4 w-4' />
                    <span className='hidden sm:inline'>Bracket</span>
                  </Button>
                )}
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('list')}
                  className='gap-1.5 h-8 px-3'
                >
                  <List className='h-4 w-4' />
                  <span className='hidden sm:inline'>List</span>
                </Button>
                <Button
                  variant={viewMode === 'column' ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => setViewMode('column')}
                  className='gap-1.5 h-8 px-3'
                >
                  <Columns className='h-4 w-4' />
                  <span className='hidden sm:inline'>Column</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'column' ? (
        <MatchesColumnView
          matches={filteredMatches}
          allMatches={localMatches}
          groups={groups}
          canUpdateMatch={canUpdateMatch}
          liveMatchIds={liveMatchIds}
          onEditMatch={handleEditMatch}
          eventFormat={eventFormat}
        />
      ) : isSingleElimination && viewMode === 'bracket' ? (
        <>
          <BracketStats
            matches={localMatches}
            totalRounds={totalRounds}
            bracketSize={bracketSize}
          />
          <BracketVisualization
            matches={localMatches}
            totalRounds={totalRounds}
          />
        </>
      ) : isDoubleElimination && viewMode === 'bracket' ? (
        <DoubleElimBracket matches={localMatches} />
      ) : isDoubleElimination ? (
        <DoubleElimList
          matches={filteredMatches}
          canUpdateMatch={canUpdateMatch}
          liveMatchIds={liveMatchIds}
          onEditMatch={handleEditMatch}
        />
      ) : (
        <MatchesListView
          matches={filteredMatches}
          groups={groups}
          canUpdateMatch={canUpdateMatch}
          liveMatchIds={liveMatchIds}
          onEditMatch={handleEditMatch}
          eventFormat={eventFormat}
          allMatches={localMatches}
        />
      )}

      {/* Match edit dialog */}
      <Dialog
        open={selectedMatch !== null}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        {selectedMatch && (
          <MatchResultsForm
            match={selectedMatch}
            onSuccess={() => {
              setSelectedMatch(null)
              onMatchUpdate?.()
            }}
            onCancel={() => setSelectedMatch(null)}
          />
        )}
      </Dialog>
    </div>
  )
}

export default MatchesView
