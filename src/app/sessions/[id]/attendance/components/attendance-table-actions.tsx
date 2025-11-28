'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Circle,
  Trash2,
} from 'lucide-react'
import type {
  AttendanceRecord,
  AttendanceStatus,
} from '@/hooks/use-training-session-attendance'
import { AttendanceStatusBadge } from '@/components/training-sessions/attendance-status-badge'

// Hook to detect mobile screen size
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

interface AttendanceTableActionsProps {
  record: AttendanceRecord
  onStatusChange: (playerId: string, status: AttendanceStatus) => void
  onDelete: (playerId: string) => void
  isLoading?: boolean
}

const quickStatusOptions: Array<{
  value: AttendanceStatus
  label: string
  icon: React.ReactNode
}> = [
  {
    value: 'present',
    label: 'Present',
    icon: <CheckCircle2 className='h-4 w-4 text-green-600' />,
  },
  {
    value: 'late',
    label: 'Late',
    icon: <Clock className='h-4 w-4 text-orange-600' />,
  },
  {
    value: 'absent_excused',
    label: 'Absent (Excused)',
    icon: <XCircle className='h-4 w-4 text-blue-600' />,
  },
  {
    value: 'absent_unexcused',
    label: 'Absent (Unexcused)',
    icon: <XCircle className='h-4 w-4 text-red-600' />,
  },
  {
    value: 'suspended',
    label: 'Suspended',
    icon: <Ban className='h-4 w-4 text-gray-600' />,
  },
]

const allStatusOptions: Array<{
  value: AttendanceStatus
  label: string
  icon: React.ReactNode
}> = [
  {
    value: 'pending',
    label: 'Pending',
    icon: <Circle className='h-4 w-4 text-yellow-600' />,
  },
  ...quickStatusOptions,
]

export const AttendanceTableActions = ({
  record,
  onStatusChange,
  onDelete,
  isLoading = false,
}: AttendanceTableActionsProps) => {
  const isMobile = useIsMobile()

  // Filter out suspended from quick actions on mobile
  const visibleQuickOptions = isMobile
    ? quickStatusOptions.filter((option) => option.value !== 'suspended')
    : quickStatusOptions

  return (
    <AlertDialog>
      <div className='flex items-center gap-1 justify-end'>
        {/* Quick action buttons for common statuses */}
        <div className='flex items-center gap-1'>
          {visibleQuickOptions.map((option) => (
            <Button
              key={option.value}
              variant='ghost'
              size='sm'
              className='h-8 w-8 p-0'
              onClick={() => onStatusChange(record.playerId, option.value)}
              disabled={isLoading || record.status === option.value}
              title={option.label}
            >
              {option.icon}
            </Button>
          ))}
        </div>

        {/* Dropdown for all options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='h-8 w-8 p-0'
              disabled={isLoading}
            >
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
            {allStatusOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onStatusChange(record.playerId, option.value)}
                disabled={record.status === option.value}
              >
                <div className='flex items-center gap-2'>
                  {option.icon}
                  <AttendanceStatusBadge status={option.value} />
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                className='text-destructive focus:text-destructive focus:bg-destructive/10'
                onSelect={(e) => e.preventDefault()}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Remove Player
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Player from Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {record.player.name} from this
            training session? This will delete their attendance record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            onClick={() => onDelete(record.playerId)}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
