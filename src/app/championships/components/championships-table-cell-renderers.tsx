import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const NameCell = ({ name }: { name: string }) => (
  <div className='font-medium'>{name}</div>
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

export const DateCell = ({ date }: { date: string | Date | null }) => (
  <div>
    {date ? formatDate(date) : <span className='text-muted-foreground'>—</span>}
  </div>
)
