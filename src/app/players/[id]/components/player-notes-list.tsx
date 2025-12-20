'use client'

import React, { useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlayerNotesStore } from '@/store/player-notes-store'
import PlayerNoteCard from './player-note-card'
import PlayerNotesFilters from './player-notes-filters'

interface PlayerNotesListProps {
  playerId: string
}

type NoteTypeFilter = 'all' | 'performance' | 'medical' | 'behavioral' | 'general'

const PlayerNotesList = ({ playerId }: PlayerNotesListProps) => {
  const { notes, isLoading, pagination, fetchNotes } = usePlayerNotesStore()
  const [activeFilter, setActiveFilter] = useState<NoteTypeFilter>('all')

  useEffect(() => {
    // Fetch notes when component mounts or filter changes
    fetchNotes(playerId, {
      noteType: activeFilter,
      page: 1,
      limit: 20,
    })
  }, [playerId, activeFilter, fetchNotes])

  const handleFilterChange = (filter: NoteTypeFilter) => {
    setActiveFilter(filter)
  }

  const handleLoadMore = () => {
    fetchNotes(playerId, {
      noteType: activeFilter,
      page: pagination.page + 1,
      limit: pagination.limit,
    })
  }

  // Loading skeleton
  if (isLoading && notes.length === 0) {
    return (
      <div className="space-y-4">
        <PlayerNotesFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Empty state
  if (!isLoading && notes.length === 0) {
    return (
      <div className="space-y-4">
        <PlayerNotesFilters
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">
            {activeFilter === 'all'
              ? 'No notes yet'
              : `No ${activeFilter} notes`}
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeFilter === 'all'
              ? 'Add the first note to start tracking observations about this player.'
              : `No ${activeFilter} notes have been added for this player yet.`}
          </p>
        </div>
      </div>
    )
  }

  const hasMore = pagination.page < pagination.totalPages

  return (
    <div className="space-y-4">
      <PlayerNotesFilters
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Timeline */}
      <div className="pt-4">
        {notes.map((note) => (
          <PlayerNoteCard key={note.id} note={note} playerId={playerId} />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Pagination info */}
      {notes.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {notes.length} of {pagination.totalItems} notes
        </div>
      )}
    </div>
  )
}

export default PlayerNotesList
