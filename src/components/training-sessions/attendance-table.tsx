'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AttendanceStatusSelector } from './attendance-status-selector'
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '@/hooks/use-training-session-attendance'
import { Loader2 } from 'lucide-react'

interface AttendanceTableProps {
  records: AttendanceRecord[]
  onStatusChange: (playerId: string, status: AttendanceStatus) => void
  updatingPlayerId: string | null
  isLoading?: boolean
  searchQuery?: string
  statusFilter?: AttendanceStatus | 'all'
}

export const AttendanceTable = ({
  records,
  onStatusChange,
  updatingPlayerId,
  isLoading = false,
  searchQuery = '',
  statusFilter = 'all',
}: AttendanceTableProps) => {
  // Filter records
  const filteredRecords = records.filter((record) => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      record.player.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus =
      statusFilter === 'all' || record.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (filteredRecords.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-lg font-medium text-muted-foreground'>
          {records.length === 0
            ? 'No attendance records found'
            : 'No players match the current filters'}
        </p>
        <p className='text-sm text-muted-foreground mt-2'>
          {records.length === 0
            ? 'Initialize attendance to start tracking player attendance.'
            : 'Try adjusting your search terms or filters.'}
        </p>
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRecords.map((record) => {
            const isUpdating = updatingPlayerId === record.playerId

            return (
              <TableRow key={record.id}>
                <TableCell className='font-medium'>
                  {record.player.name}
                </TableCell>
                <TableCell>
                  <AttendanceStatusSelector
                    value={record.status}
                    onValueChange={(status) =>
                      onStatusChange(record.playerId, status)
                    }
                    isLoading={isUpdating}
                    disabled={isUpdating}
                  />
                </TableCell>
                <TableCell className='text-right'>
                  {isUpdating && (
                    <Loader2 className='h-4 w-4 animate-spin inline-block ml-2' />
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

