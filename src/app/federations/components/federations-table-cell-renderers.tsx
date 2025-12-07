import { formatDate } from '@/lib/utils'
import type { Federation } from '@/db/schema'

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

export const DateCell = ({ date }: { date: string | Date }) => (
  <div>{formatDate(date)}</div>
)

