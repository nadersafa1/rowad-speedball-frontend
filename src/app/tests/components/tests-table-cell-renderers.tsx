import { Badge } from '@/components/ui/badge'
import { Test } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getTestTypeConfigFromTest } from '../utils/test-type.utils'

export const NameCell = ({ test }: { test: Test }) => {
  return (
    <Link
      href={`/tests/${test.id}`}
      className='font-medium hover:underline text-blue-600 dark:text-blue-400'
    >
      {test.name}
    </Link>
  )
}

export const TestTypeCell = ({ test }: { test: Test }) => {
  const testConfig = getTestTypeConfigFromTest(test)
  return (
    <Badge
      variant='outline'
      className={`${testConfig.color} border`}
    >
      {testConfig.label}
    </Badge>
  )
}

export const DateConductedCell = ({
  dateConducted,
}: {
  dateConducted: string
}) => {
  return (
    <span className='text-sm'>
      {format(new Date(dateConducted), 'MMM d, yyyy')}
    </span>
  )
}

export const StatusCell = ({ status }: { status?: string }) => {
  if (!status) return <span className='text-muted-foreground'>—</span>

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    upcoming: { label: 'Upcoming', variant: 'outline' },
    today: { label: 'Today', variant: 'default' },
    completed: { label: 'Completed', variant: 'secondary' },
  }

  const config = statusConfig[status] || { label: status, variant: 'outline' as const }

  return <Badge variant={config.variant}>{config.label}</Badge>
}

export const OrganizationNameCell = ({
  organizationName,
}: {
  organizationName?: string | null
}) => {
  return (
    <span className='text-sm'>{organizationName || '—'}</span>
  )
}

export const DescriptionCell = ({
  description,
}: {
  description?: string | null
}) => {
  if (!description) {
    return <span className='text-muted-foreground'>—</span>
  }

  const truncated = description.length > 50
    ? `${description.substring(0, 50)}...`
    : description

  if (description.length <= 50) {
    return <span className='text-sm'>{description}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='text-sm cursor-help'>{truncated}</span>
        </TooltipTrigger>
        <TooltipContent className='max-w-md'>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const TotalTimeCell = ({
  formattedTotalTime,
}: {
  formattedTotalTime?: string
}) => {
  return (
    <span className='text-sm'>{formattedTotalTime || '—'}</span>
  )
}

