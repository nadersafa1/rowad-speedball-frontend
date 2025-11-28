import { ColumnDef } from '@tanstack/react-table'
import { TrainingSession, Coach } from '@/db/schema'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { SortableHeader } from './training-sessions-table-sortable-header'
import { formatDate } from '@/lib/utils'

interface TrainingSessionWithCoaches extends TrainingSession {
  coaches?: Coach[]
  organizationName?: string | null
}

export const createBaseColumns = (
  sortBy?: string,
  sortOrder?: 'asc' | 'desc',
  onSort?: (columnId: string) => void,
  isSystemAdmin?: boolean
): ColumnDef<TrainingSessionWithCoaches>[] => {
  const columns: ColumnDef<TrainingSessionWithCoaches>[] = [
    {
      accessorKey: 'name',
      id: 'name',
      enableHiding: false,
      header: () => (
        <SortableHeader
          label='Name'
          sortBy={sortBy}
          sortOrder={sortOrder}
          field='name'
          onSort={onSort}
        />
      ),
      cell: ({ row }) => (
        <Link
          href={`/sessions/${row.original.id}`}
          className='font-medium hover:underline'
        >
          {row.getValue('name')}
        </Link>
      ),
    },
    {
      accessorKey: 'intensity',
      id: 'intensity',
      header: () => (
        <SortableHeader
          label='Intensity'
          sortBy={sortBy}
          sortOrder={sortOrder}
          field='intensity'
          onSort={onSort}
        />
      ),
      cell: ({ row }) => {
        const intensity = row.getValue('intensity') as string
        return (
          <Badge
            variant={
              intensity === 'high'
                ? 'destructive'
                : intensity === 'normal'
                ? 'default'
                : 'secondary'
            }
          >
            {intensity}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'type',
      id: 'type',
      header: () => <div>Type</div>,
      cell: ({ row }) => {
        const types = row.getValue('type') as string[]
        const labels: Record<string, string> = {
          singles: 'Singles',
          men_doubles: 'Men Doubles',
          women_doubles: 'Women Doubles',
          mixed_doubles: 'Mixed Doubles',
          solo: 'Solo',
          relay: 'Relay',
        }
        return (
          <div className='flex flex-wrap gap-1'>
            {types.map((t, idx) => (
              <Badge key={idx} variant='outline'>
                {labels[t] || t}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'date',
      id: 'date',
      header: () => (
        <SortableHeader
          label='Date'
          sortBy={sortBy}
          sortOrder={sortOrder}
          field='date'
          onSort={onSort}
        />
      ),
      cell: ({ row }) => {
        const date = row.getValue('date') as string
        return <span>{formatDate(date)}</span>
      },
    },
    {
      accessorKey: 'ageGroups',
      id: 'ageGroups',
      header: () => <div>Age Groups</div>,
      cell: ({ row }) => {
        const ageGroups = row.getValue('ageGroups') as string[]
        return (
          <div className='flex flex-wrap gap-1'>
            {ageGroups.map((ag, idx) => (
              <Badge key={idx} variant='secondary'>
                {ag}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'coaches',
      id: 'coaches',
      header: () => <div>Coaches</div>,
      cell: ({ row }) => {
        const coaches = row.original.coaches || []
        return (
          <span className='text-sm'>
            {coaches.length > 0
              ? `${coaches.length} coach${coaches.length > 1 ? 'es' : ''}`
              : 'None'}
          </span>
        )
      },
    },
  ]

  // Add organization column only for system admin
  if (isSystemAdmin) {
    columns.push({
      accessorKey: 'organizationName',
      id: 'organizationName',
      header: () => <div>Club</div>,
      cell: ({ row }) => {
        const orgName = row.getValue('organizationName') as string | null
        return (
          <span className='text-sm'>
            {orgName || (
              <span className='text-muted-foreground'>No Club</span>
            )}
          </span>
        )
      },
    })
  }

  return columns
}

