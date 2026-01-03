import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const NameCell = ({ name, id }: { name: string; id: string }) => (
  <Link
    href={`/championships/${id}`}
    className='font-medium hover:underline text-blue-600 dark:text-blue-400'
  >
    {name}
  </Link>
)

export const DescriptionCell = ({
  description,
}: {
  description: string | null
}) => (
  <div className='max-w-[300px] truncate text-sm text-muted-foreground'>
    {description || <span className='text-muted-foreground'>—</span>}
  </div>
)

export const FederationCell = ({
  federationName,
}: {
  federationName: string | null
}) => (
  <Badge variant='outline' className='font-normal'>
    {federationName || 'Unknown'}
  </Badge>
)

export const CompetitionScopeCell = ({
  competitionScope,
}: {
  competitionScope: 'clubs' | 'open'
}) => (
  <Badge variant={competitionScope === 'clubs' ? 'default' : 'secondary'}>
    {competitionScope === 'clubs' ? 'Clubs' : 'Open'}
  </Badge>
)
