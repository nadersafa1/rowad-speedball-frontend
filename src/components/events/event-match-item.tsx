'use client'

import MatchCard from '@/components/matches/match-card'
import type { Match } from '@/types'

interface EventMatchItemProps {
  match: Match
  groupName?: string | null
  onEditClick?: () => void
  showEditButton?: boolean
  isLive?: boolean
}

const EventMatchItem = ({
  match,
  groupName,
  onEditClick,
  showEditButton = false,
  isLive = false,
}: EventMatchItemProps) => {
  return (
    <MatchCard
      match={match}
      groupName={groupName}
      showEditButton={showEditButton}
      onEditClick={onEditClick}
      playerPerspective={false}
      isLive={isLive}
    />
  )
}

export default EventMatchItem
