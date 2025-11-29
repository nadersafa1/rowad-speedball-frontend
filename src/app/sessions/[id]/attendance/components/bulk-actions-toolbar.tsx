'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AttendanceStatusSelector } from '@/components/training-sessions/attendance-status-selector'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'
import { X, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface BulkActionsToolbarProps {
  selectedCount: number
  selectedPlayerIds: string[]
  onStatusChange: (status: AttendanceStatus) => void
  onDelete: (playerIds: string[]) => void
  onClearSelection: () => void
}

export const BulkActionsToolbar = ({
  selectedCount,
  selectedPlayerIds,
  onStatusChange,
  onDelete,
  onClearSelection,
}: BulkActionsToolbarProps) => {
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatus>('pending')
  const [isApplying, setIsApplying] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleApply = async () => {
    setIsApplying(true)
    try {
      await onStatusChange(selectedStatus)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRemove = async () => {
    setIsRemoving(true)
    try {
      await onDelete(selectedPlayerIds)
      onClearSelection()
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Card className='border-primary bg-primary/5'>
      <CardContent className='pt-4 pb-4'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <span className='font-medium text-sm'>
              {selectedCount} player{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto'>
            <div className='w-full sm:w-auto'>
              <AttendanceStatusSelector
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isApplying}
                isLoading={false}
              />
            </div>
            <Button
              onClick={handleApply}
              disabled={isApplying || isRemoving}
              className='w-full sm:w-auto'
            >
              {isApplying ? 'Applying...' : 'Apply Status'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  disabled={isApplying || isRemoving}
                  className='w-full sm:w-auto'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  {isRemoving ? 'Removing...' : 'Remove'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Attendance Records?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove attendance records for{' '}
                    {selectedCount} player{selectedCount !== 1 ? 's' : ''}? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isRemoving}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  >
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant='outline'
              onClick={onClearSelection}
              disabled={isApplying || isRemoving}
              className='w-full sm:w-auto'
            >
              <X className='h-4 w-4 mr-2' />
              Clear Selection
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

