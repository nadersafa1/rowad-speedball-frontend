'use client'

import type { Match, PlayerMatch } from '@/types'
import MatchCardHeader from './match-card-header'
import MatchCardPlayers from './match-card-players'
import MatchCardSets from './match-card-sets'
import {
  getRegistrations,
  getPlayersFromRegistration,
  calculateSetsResult,
  getIndividualSetScores,
  getWinnerStatus,
  getScoreColor,
} from './match-card.utils'

interface MatchCardProps {
  match: Match | PlayerMatch
  groupName?: string | null
  showEditButton?: boolean
  onEditClick?: () => void
  playerPerspective?: boolean
  isLive?: boolean
}

const MatchCard = ({
  match,
  groupName,
  showEditButton = false,
  onEditClick,
  playerPerspective = false,
  isLive = false,
}: MatchCardProps) => {
  const isPlayerMatch = 'playerRegistration' in match && playerPerspective
  const { getRegistration1, getRegistration2 } = getRegistrations(
    match,
    isPlayerMatch
  )
  const isPlayerReg1 = isPlayerMatch
    ? getRegistration1()?.id === match.registration1Id
    : true

  const reg1Players = getPlayersFromRegistration(getRegistration1())
  const reg2Players = getPlayersFromRegistration(getRegistration2())
  const { reg1Sets, reg2Sets } = calculateSetsResult(
    match.sets,
    isPlayerMatch,
    isPlayerReg1
  )
  const individualSets = getIndividualSetScores(
    match.sets,
    isPlayerMatch,
    isPlayerReg1
  )
  const winnerStatus = getWinnerStatus(
    match,
    isPlayerMatch,
    getRegistration1,
    getRegistration2
  )

  return (
    <div className='border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-card'>
      <MatchCardHeader
        match={match}
        isPlayerMatch={isPlayerMatch}
        groupName={groupName}
        showEditButton={showEditButton}
        onEditClick={onEditClick}
        isLive={isLive}
      />

      <div className='p-4'>
        {(match.played || (match.sets && match.sets.length > 0)) && (
          <div className='flex items-center justify-center mb-4'>
            <div
              className={`text-5xl font-bold ${getScoreColor(winnerStatus)}`}
            >
              {reg1Sets} - {reg2Sets}
            </div>
          </div>
        )}

        <div className='grid grid-cols-2 gap-6'>
          <MatchCardPlayers players={reg1Players} align='right' />
          <MatchCardPlayers players={reg2Players} align='left' />
        </div>

        <MatchCardSets sets={individualSets} />
      </div>
    </div>
  )
}

export default MatchCard
