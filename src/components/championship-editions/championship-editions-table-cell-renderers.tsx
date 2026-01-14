import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const StatusCell = ({
  status,
}: {
  status: 'draft' | 'published' | 'archived'
}) => {
  const variants = {
    draft: 'secondary' as const,
    published: 'default' as const,
    archived: 'outline' as const,
  }

  const labels = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
  }

  return <Badge variant={variants[status]}>{labels[status]}</Badge>
}

export const RegistrationDatesCell = ({
  startDate,
  endDate,
}: {
  startDate: string | null
  endDate: string | null
}) => {
  if (!startDate && !endDate) {
    return <span className='text-sm text-muted-foreground'>—</span>
  }

  if (startDate && endDate) {
    return (
      <span className='text-sm'>
        {formatDate(startDate)} - {formatDate(endDate)}
      </span>
    )
  }

  if (startDate) {
    return <span className='text-sm'>From {formatDate(startDate)}</span>
  }

  return <span className='text-sm'>Until {formatDate(endDate!)}</span>
}
