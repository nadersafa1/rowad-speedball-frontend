'use client'

import { useState, useMemo } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import type { Match, Group, EventFormat } from '@/types'
import MatchResultsForm from './match-results-form'
import MatchesListView from './matches-list-view'
import BracketStats from './bracket-stats'
import BracketVisualization from '@/components/tournaments/bracket-visualization'
import DoubleElimList from './double-elim-list'
import DoubleElimBracket from '@/components/tournaments/double-elim-bracket'
import { useMatchesSocket } from './use-matches-socket'
import { nextPowerOf2 } from '@/lib/utils/single-elimination-helpers'
import MatchesFilters, { type MatchStatus } from './matches-filters'

type ViewMode = 'bracket' | 'list'

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<MatchStatus>('all')

  const { localMatches, liveMatchIds } = useMatchesSocket(matches)

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

  // Filter matches based on group, status, and hide played BYE matches for elimination formats
  const filteredMatches = useMemo(() => {
    return localMatches.filter((match) => {
      // Hide matches with no participants (both sides null)
      if ((isSingleElimination || isDoubleElimination) && isEmptyMatch(match)) {
        return false
      }

      // Hide played BYE matches in single/double elimination list view
      // Unplayed BYE matches are shown so users can see pending auto-advances
      if (
        (isSingleElimination || isDoubleElimination) &&
        isByeMatch(match) &&
        match.played
      ) {
        return false
      }

      // Group filter
      if (groupFilter !== 'all' && match.groupId !== groupFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isPlayed = match.played
        const isLive = !match.played && liveMatchIds.has(match.id)
        const isUpcoming = !match.played && !liveMatchIds.has(match.id)

        if (statusFilter === 'played' && !isPlayed) return false
        if (statusFilter === 'live' && !isLive) return false
        if (statusFilter === 'upcoming' && !isUpcoming) return false
      }

      return true
    })
  }, [
    localMatches,
    groupFilter,
    statusFilter,
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

  return (
    <div className='space-y-4'>
      {/* Header with filters and view toggle */}
      {localMatches.length > 0 && (
        <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-3 pt-2'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <MatchesFilters
              groups={groups}
              groupFilter={groupFilter}
              statusFilter={statusFilter}
              onGroupChange={setGroupFilter}
              onStatusChange={setStatusFilter}
              showGroupFilter={!isSingleElimination && !isDoubleElimination}
            />
            {(isSingleElimination || isDoubleElimination) && (
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>View:</span>
                <div className='flex items-center gap-1 p-1 bg-muted rounded-lg'>
                  <Button
                    variant={viewMode === 'bracket' ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setViewMode('bracket')}
                    className='gap-1.5 h-8 px-3'
                  >
                    <LayoutGrid className='h-4 w-4' />
                    <span className='hidden sm:inline'>Bracket</span>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setViewMode('list')}
                    className='gap-1.5 h-8 px-3'
                  >
                    <List className='h-4 w-4' />
                    <span className='hidden sm:inline'>List</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {isSingleElimination && viewMode === 'bracket' ? (
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
          canUpdate={canUpdate}
          liveMatchIds={liveMatchIds}
          onEditMatch={handleEditMatch}
        />
      ) : (
        <MatchesListView
          matches={filteredMatches}
          groups={groups}
          canUpdate={canUpdate}
          liveMatchIds={liveMatchIds}
          onEditMatch={handleEditMatch}
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
