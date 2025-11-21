import Link from 'next/link'

interface Player {
  name: string
  id: string | null
}

interface MatchCardPlayersProps {
  players: Player[]
  align: 'left' | 'right'
}

const MatchCardPlayers = ({ players, align }: MatchCardPlayersProps) => {
  const alignmentClass = align === 'right' ? 'text-right' : 'text-left'

  return (
    <div className='space-y-2'>
      <div className={`flex flex-col space-y-1 ${alignmentClass}`}>
        {players.map((player, idx) =>
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
  )
}

export default MatchCardPlayers

