'use client'

import MatchCard from '@/components/matches/match-card'
import type { Match } from '@/types'

interface EventMatchItemProps {
  match: Match
  groupName?: string | null
  onEditClick?: () => void
  showEditButton?: boolean
}

const EventMatchItem = ({
  match,
  groupName,
  onEditClick,
  showEditButton = false,
}: EventMatchItemProps) => {
  return (
    <MatchCard
      match={match}
      groupName={groupName}
      showEditButton={showEditButton}
      onEditClick={onEditClick}
      playerPerspective={false}
    />
  )
}

export default EventMatchItem
