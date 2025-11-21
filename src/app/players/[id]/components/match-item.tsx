import MatchCard from '@/components/matches/match-card'
import { PlayerMatch } from '@/types'

interface MatchItemProps {
  match: PlayerMatch
}

const MatchItem = ({ match }: MatchItemProps) => {
  return (
    <MatchCard
      match={match}
      playerPerspective={true}
    />
  )
}

export default MatchItem
