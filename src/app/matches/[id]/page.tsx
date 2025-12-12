'use client'

import { useParams } from 'next/navigation'
import { useMatchSocket } from './_hooks/use-match-socket'
import {
  MatchDateSection,
  MatchDetailsSection,
  WinnerCelebration,
  CurrentSetEditor,
  AddSetCard,
  DateNotSetCard,
  LoadingState,
  AccessDeniedState,
} from './_components'
import {
  calculateSetWins,
  getPlayerName,
  getCurrentSet,
  areAllSetsPlayed,
  hasMajorityReached,
  getWinnerName,
  getMajorityWinnerName,
} from './_utils/match-helpers'
import MatchCard from '@/components/matches/match-card'
import { PageBreadcrumb } from '@/components/ui'

const MatchDetailPage = () => {
  const params = useParams()
  const matchId = params.id as string

  const {
    match,
    matchDate,
    status,
    error,
    accessDenied,
    isDateSaving,
    actions,
  } = useMatchSocket(matchId)

  // Loading and error states
  if (status === 'connecting' || status === 'loading' || !match) {
    return <LoadingState status={status} error={error} />
  }

  if (status === 'error' && error) {
    return <LoadingState status={status} error={error} />
  }

  if (accessDenied) {
    return <AccessDeniedState />
  }

  // Derived state
  const bestOf = match.bestOf || 3
  const setWins = calculateSetWins(match.sets)
  const player1Name = getPlayerName(match.registration1)
  const player2Name = getPlayerName(match.registration2)
  const currentSet = getCurrentSet(match.sets)
  const allSetsPlayed = areAllSetsPlayed(match.sets)
  const majorityReached = hasMajorityReached(
    setWins.player1,
    setWins.player2,
    bestOf
  )
  const winnerName = getWinnerName(match, player1Name, player2Name)
  const majorityWinnerName = getMajorityWinnerName(
    setWins.player1,
    setWins.player2,
    bestOf,
    player1Name,
    player2Name
  )
  const isDateSet = !!match.matchDate

  // Generate match label for breadcrumb
  const matchLabel = match.event
    ? `${match.event.name} - Match`
    : `${player1Name} vs ${player2Name}`

  return (
    <div className='container mx-auto p-4 space-y-6'>
      <PageBreadcrumb currentPageLabel={matchLabel || 'Match'} />

      <MatchDateSection
        matchDate={matchDate}
        isDateSet={isDateSet}
        isDateSaving={isDateSaving}
        isMatchPlayed={match.played}
        onDateChange={actions.updateDate}
      />

      <MatchDetailsSection match={match} />

      <MatchCard match={match} />

      {match.played && winnerName && (
        <WinnerCelebration
          winnerName={winnerName}
          player1Wins={setWins.player1}
          player2Wins={setWins.player2}
          matchDate={match.matchDate}
        />
      )}

      {currentSet && !match.played && isDateSet && (
        <CurrentSetEditor
          currentSet={currentSet}
          match={match}
          onScoreUpdate={actions.updateScore}
          onMarkAsPlayed={actions.markSetPlayed}
        />
      )}

      {!currentSet && !match.played && isDateSet && (
        <AddSetCard
          matchId={matchId}
          currentSetCount={match.sets?.length || 0}
          bestOf={bestOf}
          allSetsPlayed={allSetsPlayed}
          hasMajorityReached={majorityReached}
          majorityWinnerName={majorityWinnerName}
          onCreateSet={actions.createSet}
        />
      )}

      {!isDateSet && !match.played && <DateNotSetCard />}
    </div>
  )
}

export default MatchDetailPage
