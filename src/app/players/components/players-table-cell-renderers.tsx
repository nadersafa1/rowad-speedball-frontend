import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Player } from '@/types'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'

export const NameCell = ({
  player,
  name,
}: {
  player: Player & { userId?: string | null }
  name: string
}) => (
  <div className='flex items-center gap-2'>
    <Link
      href={`/players/${player.id}`}
      className='font-medium text-rowad-600 hover:text-rowad-700 hover:underline transition-colors'
    >
      {name}
    </Link>
    {(player as any).userId && <BadgeCheck className='h-4 w-4 text-blue-500' />}
  </div>
)

export const GenderCell = ({ gender }: { gender: string }) => (
  <Badge variant={gender === 'male' ? 'default' : 'secondary'}>
    {gender === 'male' ? '👨' : '👩'}{' '}
    {gender.charAt(0).toUpperCase() + gender.slice(1)}
  </Badge>
)

export const AgeGroupCell = ({ ageGroup }: { ageGroup: string }) => (
  <div className='font-medium text-speedball-600'>{ageGroup}</div>
)

export const PreferredHandCell = ({ hand }: { hand: string }) => (
  <div className='capitalize'>{hand}</div>
)

export const DateCell = ({ date }: { date: string }) => (
  <div>{formatDate(date)}</div>
)

export const ClubCell = ({
  organizationName,
}: {
  organizationName?: string | null
}) => (
  <div className='text-sm'>
    {organizationName || <span className='text-muted-foreground'>—</span>}
  </div>
)
