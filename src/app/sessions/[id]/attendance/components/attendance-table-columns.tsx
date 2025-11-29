'use client'

import { ColumnDef } from '@tanstack/react-table'
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '@/hooks/use-training-session-attendance'
import { AttendanceStatusBadge } from '@/components/training-sessions/attendance-status-badge'
import { AttendanceTableActions } from './attendance-table-actions'
import Link from 'next/link'
import { getAgeGroup } from '@/db/schema'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

export const createAttendanceColumns = (
  onStatusChange: (playerId: string, status: AttendanceStatus) => void,
  onDelete: (playerId: string) => void,
  updatingPlayerId: string | null
): ColumnDef<AttendanceRecord>[] => [
  {
    id: 'select',
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
      />
    ),
  },
  {
    accessorKey: 'player.name',
    id: 'name',
    header: 'Player Name',
    enableHiding: false,
    cell: ({ row }) => {
      const player = row.original.player
      return (
        <Link
          href={`/players/${player.id}`}
          className='font-medium text-rowad-600 hover:text-rowad-700 hover:underline transition-colors'
        >
          {player.name}
        </Link>
      )
    },
  },
  {
    accessorKey: 'player.gender',
    id: 'gender',
    header: 'Gender',
    cell: ({ row }) => {
      const gender = row.original.player.gender
      if (!gender) return <span className='text-muted-foreground'>—</span>
      return (
        <Badge variant={gender === 'male' ? 'default' : 'secondary'}>
          {gender === 'male' ? '👨' : '👩'}{' '}
          {gender.charAt(0).toUpperCase() + gender.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'player.ageGroup',
    id: 'ageGroup',
    header: 'Age Group',
    cell: ({ row }) => {
      const player = row.original.player
      const ageGroup = player.dateOfBirth
        ? getAgeGroup(player.dateOfBirth)
        : '-'
      return <span>{ageGroup}</span>
    },
  },
  {
    accessorKey: 'status',
    id: 'status',
    header: 'Status',
    enableHiding: false,
    cell: ({ row }) => {
      return <AttendanceStatusBadge status={row.original.status} />
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => <div className='text-right'>Actions</div>,
    cell: ({ row }) => {
      const isUpdating = updatingPlayerId === row.original.playerId
      return (
        <div className='text-right'>
          <AttendanceTableActions
            record={row.original}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            isLoading={isUpdating}
          />
        </div>
      )
    },
  },
]
