'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Registration } from '@/types'
import { formatPlayers } from '@/lib/utils/player-formatting'

interface SortableRegistrationItemProps {
  registration: Registration
  seed: number
}

const SortableRegistrationItem = ({
  registration,
  seed,
}: SortableRegistrationItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: registration.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const playerNames = formatPlayers(registration.players)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-lg bg-card transition-colors ${
        isDragging ? 'opacity-50 shadow-lg border-primary' : 'hover:bg-muted/50'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className='cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none'
        aria-label='Drag to reorder'
      >
        <GripVertical className='h-5 w-5 text-muted-foreground' />
      </button>

      <Badge
        variant='secondary'
        className='min-w-[2.5rem] justify-center text-sm font-bold'
      >
        #{seed}
      </Badge>

      <div className='flex-1 min-w-0'>
        <p className='font-medium truncate'>{playerNames}</p>
      </div>

      {/* <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          {registration.matchesWon}W - {registration.matchesLost}L
        </span>
        <span className="font-semibold text-foreground">
          {registration.points} pts
        </span>
      </div> */}
    </div>
  )
}

export default SortableRegistrationItem
