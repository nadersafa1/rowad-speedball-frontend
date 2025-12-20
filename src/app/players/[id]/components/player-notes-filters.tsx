'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

type NoteTypeFilter = 'all' | 'performance' | 'medical' | 'behavioral' | 'general'

interface PlayerNotesFiltersProps {
  activeFilter: NoteTypeFilter
  onFilterChange: (filter: NoteTypeFilter) => void
}

const FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Notes' },
  { value: 'performance' as const, label: 'Performance' },
  { value: 'medical' as const, label: 'Medical' },
  { value: 'behavioral' as const, label: 'Behavioral' },
  { value: 'general' as const, label: 'General' },
]

const PlayerNotesFilters = ({
  activeFilter,
  onFilterChange,
}: PlayerNotesFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={activeFilter === option.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(option.value)}
          className={
            activeFilter === option.value
              ? 'bg-rowad-600 hover:bg-rowad-700'
              : ''
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

export default PlayerNotesFilters
