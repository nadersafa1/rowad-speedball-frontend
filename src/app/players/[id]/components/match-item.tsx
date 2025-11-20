import Link from 'next/link'
import { Calendar, Trophy } from 'lucide-react'
import { PlayerMatch } from '@/types'

interface MatchItemProps {
  match: PlayerMatch
}

const MatchItem = ({ match }: MatchItemProps) => {
  const isPlayerReg1 = match.playerRegistration?.id === match.registration1Id

  const getPlayerNames = () => {
    if (!match.playerRegistration) return [{ name: 'Unknown', id: null }]
    const players = [
      {
        name: match.playerRegistration.player1?.name || 'Unknown',
        id: match.playerRegistration.player1?.id || null,
      },
    ]
    if (match.playerRegistration.player2) {
      players.push({
        name: match.playerRegistration.player2.name,
        id: match.playerRegistration.player2.id,
      })
    }
    return players
  }

  const getOpponentNames = () => {
    if (!match.opponentRegistration) return [{ name: 'Unknown', id: null }]
    const players = [
      {
        name: match.opponentRegistration.player1?.name || 'Unknown',
        id: match.opponentRegistration.player1?.id || null,
      },
    ]
    if (match.opponentRegistration.player2) {
      players.push({
        name: match.opponentRegistration.player2.name,
        id: match.opponentRegistration.player2.id,
      })
    }
    return players
  }

  const getSetsResult = () => {
    if (!match.sets || match.sets.length === 0) {
      return { playerSets: 0, opponentSets: 0 }
    }

    const playedSets = match.sets.filter((set) => set.played)
    let playerSets = 0
    let opponentSets = 0

    playedSets.forEach((set) => {
      const playerScore = isPlayerReg1
        ? set.registration1Score
        : set.registration2Score
      const opponentScore = isPlayerReg1
        ? set.registration2Score
        : set.registration1Score

      if (playerScore > opponentScore) {
        playerSets++
      } else if (opponentScore > playerScore) {
        opponentSets++
      }
    })

    return { playerSets, opponentSets }
  }

  const getIndividualSetScores = () => {
    if (!match.sets || match.sets.length === 0) {
      return []
    }

    return match.sets
      .filter((set) => set.played)
      .sort((a, b) => a.setNumber - b.setNumber)
      .map((set) => {
        const playerScore = isPlayerReg1
          ? set.registration1Score
          : set.registration2Score
        const opponentScore = isPlayerReg1
          ? set.registration2Score
          : set.registration1Score
        return { playerScore, opponentScore, setNumber: set.setNumber }
      })
  }

  const playerNames = getPlayerNames()
  const opponentNames = getOpponentNames()
  const { playerSets, opponentSets } = getSetsResult()
  const individualSets = getIndividualSetScores()
  const isPlayerDoubles = playerNames.length > 1
  const isOpponentDoubles = opponentNames.length > 1

  return (
    <div className='border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white'>
      {/* Event Header */}
      <div className='bg-gray-50 px-4 py-2 border-b'>
        <div className='flex items-center justify-between'>
          {match.event ? (
            <Link
              href={`/events/${match.event.id}`}
              className='text-sm font-medium text-rowad-600 hover:text-rowad-700 transition-colors'
            >
              {match.event.name}
            </Link>
          ) : (
            <span className='text-sm font-medium text-gray-600'>
              Unknown Event
            </span>
          )}
          {match.matchDate && (
            <div className='flex items-center gap-1 text-xs text-gray-500'>
              <Calendar className='h-3 w-3' />
              <span>{new Date(match.matchDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className='p-4'>
        {/* Main Sets Result - Prominent Display */}
        <div className='flex items-center justify-center mb-4'>
          <div
            className={`text-5xl font-bold ${
              match.playerWon
                ? 'text-green-600'
                : match.playerWon === false
                ? 'text-red-600'
                : 'text-gray-600'
            }`}
          >
            {playerSets}-{opponentSets}
          </div>
          {match.playerWon !== undefined && (
            <div className='ml-3'>
              {match.playerWon ? (
                <Trophy className='h-6 w-6 text-green-600' />
              ) : (
                <Trophy className='h-6 w-6 text-red-600 opacity-50' />
              )}
            </div>
          )}
        </div>

        {/* Teams and Individual Set Scores */}
        <div className='grid grid-cols-2 gap-4'>
          {/* Player Side */}
          <div className='space-y-2'>
            <div className='flex flex-col space-y-1'>
              {playerNames.map((player, idx) =>
                player.id ? (
                  <Link
                    key={idx}
                    href={`/players/${player.id}`}
                    className='text-sm font-medium text-gray-900 hover:text-rowad-600 transition-colors'
                  >
                    {player.name}
                  </Link>
                ) : (
                  <div key={idx} className='text-sm font-medium text-gray-900'>
                    {player.name}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Opponent Side */}
          <div className='space-y-2 text-right'>
            <div className='flex flex-col space-y-1'>
              {opponentNames.map((player, idx) =>
                player.id ? (
                  <Link
                    key={idx}
                    href={`/players/${player.id}`}
                    className='text-sm font-medium text-gray-900 hover:text-rowad-600 transition-colors'
                  >
                    {player.name}
                  </Link>
                ) : (
                  <div key={idx} className='text-sm font-medium text-gray-900'>
                    {player.name}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Individual Set Scores */}
        {individualSets.length > 0 && (
          <div className='mt-4 pt-4 border-t'>
            <div className='text-xs text-gray-500 mb-2 text-center'>
              Set Scores
            </div>
            <div className='flex justify-center gap-3'>
              {individualSets.map((set, idx) => (
                <div
                  key={idx}
                  className='flex flex-col items-center bg-gray-50 rounded px-3 py-1.5 min-w-[3rem]'
                >
                  <div className='text-xs text-gray-500 mb-1'>
                    Set {set.setNumber}
                  </div>
                  <div className='text-sm font-semibold'>
                    <span
                      className={
                        set.playerScore > set.opponentScore
                          ? 'text-green-600'
                          : set.playerScore < set.opponentScore
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {set.playerScore}
                    </span>
                    <span className='text-gray-400 mx-1'>-</span>
                    <span
                      className={
                        set.opponentScore > set.playerScore
                          ? 'text-green-600'
                          : set.opponentScore < set.playerScore
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {set.opponentScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchItem
