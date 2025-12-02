import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Coach } from '@/db/schema'
import Link from 'next/link'
import { BadgeCheck } from 'lucide-react'

interface CoachWithOrg extends Coach {
  organizationName?: string | null
}

export const NameCell = ({
  coach,
  name,
}: {
  coach: CoachWithOrg
  name: string
}) => (
  <div className='flex items-center gap-2'>
    <Link
      href={`/coaches/${coach.id}`}
      className='font-medium text-rowad-600 hover:text-rowad-700 hover:underline transition-colors'
    >
      {name}
    </Link>
    {coach.userId && <BadgeCheck className='h-4 w-4 text-blue-500' />}
  </div>
)

export const GenderCell = ({ gender }: { gender: string }) => (
  <Badge variant={gender === 'male' ? 'default' : 'secondary'}>
    {gender === 'male' ? '👨' : '👩'}{' '}
    {gender.charAt(0).toUpperCase() + gender.slice(1)}
  </Badge>
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

