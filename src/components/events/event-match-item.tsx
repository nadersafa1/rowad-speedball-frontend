'use client'

import Link from 'next/link'
import { Calendar, Trophy, Edit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const getRegistration1Players = () => {
    if (!match.registration1) return [{ name: 'Unknown', id: null }]
    const players = [
      {
        name: match.registration1.player1?.name || 'Unknown',
        id: match.registration1.player1?.id || null,
      },
    ]
    if (match.registration1.player2) {
      players.push({
        name: match.registration1.player2.name,
        id: match.registration1.player2.id,
      })
    }
    return players
  }

  const getRegistration2Players = () => {
    if (!match.registration2) return [{ name: 'Unknown', id: null }]
    const players = [
      {
        name: match.registration2.player1?.name || 'Unknown',
        id: match.registration2.player1?.id || null,
      },
    ]
    if (match.registration2.player2) {
      players.push({
        name: match.registration2.player2.name,
        id: match.registration2.player2.id,
      })
    }
    return players
  }

  const getSetsResult = () => {
    if (!match.sets || match.sets.length === 0) {
      return { reg1Sets: 0, reg2Sets: 0 }
    }

    const playedSets = match.sets.filter((set) => set.played)
    let reg1Sets = 0
    let reg2Sets = 0

    playedSets.forEach((set) => {
      if (set.registration1Score > set.registration2Score) {
        reg1Sets++
      } else if (set.registration2Score > set.registration1Score) {
        reg2Sets++
      }
    })

    return { reg1Sets, reg2Sets }
  }

  const getIndividualSetScores = () => {
    if (!match.sets || match.sets.length === 0) {
      return []
    }

    return match.sets
      .filter((set) => set.played)
      .sort((a, b) => a.setNumber - b.setNumber)
      .map((set) => ({
        reg1Score: set.registration1Score,
        reg2Score: set.registration2Score,
        setNumber: set.setNumber,
      }))
  }

  const reg1Players = getRegistration1Players()
  const reg2Players = getRegistration2Players()
  const { reg1Sets, reg2Sets } = getSetsResult()
  const individualSets = getIndividualSetScores()

  return (
    <div className='border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white'>
      {/* Match Header */}
      <div className='bg-gray-50 px-4 py-2 border-b'>
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='text-sm font-medium text-gray-900'>
              Match {match.matchNumber}
            </span>
            {groupName && (
              <Badge variant='outline' className='text-xs'>
                Group {groupName}
              </Badge>
            )}
            {match.matchDate && (
              <div className='flex items-center gap-1 text-xs text-gray-500'>
                <Calendar className='h-3 w-3' />
                <span>{new Date(match.matchDate).toLocaleDateString()}</span>
              </div>
            )}
            {match.played && (
              <Badge variant='default' className='text-xs'>
                Completed
              </Badge>
            )}
          </div>
          {showEditButton && !match.played && onEditClick && (
            <Button
              variant='outline'
              size='sm'
              onClick={onEditClick}
              className='gap-2'
            >
              <Edit className='h-4 w-4' />
              <span className='hidden sm:inline'>Edit Results</span>
            </Button>
          )}
        </div>
      </div>

      {/* Scoreboard */}
      <div className='p-4'>
        {/* Main Sets Result - Prominent Display */}
        {match.played && (
          <div className='flex items-center justify-center mb-4'>
            <div
              className={`text-5xl font-bold ${
                match.winnerId ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {reg1Sets}-{reg2Sets}
            </div>
            {match.winnerId && (
              <div className='ml-3'>
                <Trophy className='h-6 w-6 text-green-600' />
              </div>
            )}
          </div>
        )}

        {/* Teams and Individual Set Scores */}
        <div className='grid grid-cols-2 gap-4'>
          {/* Registration 1 Side */}
          <div className='space-y-2'>
            <div className='flex flex-col space-y-1'>
              {reg1Players.map((player, idx) =>
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

          {/* Registration 2 Side */}
          <div className='space-y-2 text-right'>
            <div className='flex flex-col space-y-1'>
              {reg2Players.map((player, idx) =>
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
                        set.reg1Score > set.reg2Score
                          ? 'text-green-600'
                          : set.reg1Score < set.reg2Score
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {set.reg1Score}
                    </span>
                    <span className='text-gray-400 mx-1'>-</span>
                    <span
                      className={
                        set.reg2Score > set.reg1Score
                          ? 'text-green-600'
                          : set.reg2Score < set.reg1Score
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {set.reg2Score}
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

export default EventMatchItem
