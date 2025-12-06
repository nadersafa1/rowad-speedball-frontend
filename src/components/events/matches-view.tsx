'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'
import type { Match, Group, EventFormat } from '@/types'
import MatchResultsForm from './match-results-form'
import MatchesListView from './matches-list-view'
import BracketStats from './bracket-stats'
import BracketVisualization from '@/components/tournaments/bracket-visualization'
import { useMatchesSocket } from './use-matches-socket'
import { nextPowerOf2 } from '@/lib/utils/single-elimination-helpers'

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  const { localMatches, liveMatchIds } = useMatchesSocket(matches)

  // Calculate bracket stats
  const totalRounds = localMatches.length > 0 ? Math.max(...localMatches.map((m) => m.round)) : 0
  const uniqueRegs = new Set<string>()
  localMatches.forEach((m) => {
    if (m.registration1Id) uniqueRegs.add(m.registration1Id)
    if (m.registration2Id) uniqueRegs.add(m.registration2Id)
  })
  const bracketSize = nextPowerOf2(uniqueRegs.size)

  const handleEditMatch = (match: Match) => setSelectedMatch(match)

  return (
    <div className='space-y-4'>
      {/* Header with view toggle for single elimination */}
      {isSingleElimination && localMatches.length > 0 && (
        <div className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-3 pt-2'>
          <div className='flex items-center justify-between gap-2'>
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
        </div>
      )}

      {/* Content based on view mode */}
      {isSingleElimination && viewMode === 'bracket' ? (
        <>
          <BracketStats matches={localMatches} totalRounds={totalRounds} bracketSize={bracketSize} />
          <BracketVisualization matches={localMatches} totalRounds={totalRounds} />
        </>
      ) : (
        <MatchesListView
          matches={localMatches}
          groups={groups}
          canUpdate={canUpdate}
          liveMatchIds={liveMatchIds}
          onEditMatch={handleEditMatch}
        />
      )}

      {/* Match edit dialog */}
      <Dialog open={selectedMatch !== null} onOpenChange={(open) => !open && setSelectedMatch(null)}>
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
