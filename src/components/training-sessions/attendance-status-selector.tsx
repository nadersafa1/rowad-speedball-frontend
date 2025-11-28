'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AttendanceStatusBadge } from './attendance-status-badge'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'
import { Loader2 } from 'lucide-react'

interface AttendanceStatusSelectorProps {
  value: AttendanceStatus
  onValueChange: (value: AttendanceStatus) => void
  disabled?: boolean
  isLoading?: boolean
}

const statusOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent_excused', label: 'Absent (Excused)' },
  { value: 'absent_unexcused', label: 'Absent (Unexcused)' },
  { value: 'suspended', label: 'Suspended' },
]

export const AttendanceStatusSelector = ({
  value,
  onValueChange,
  disabled = false,
  isLoading = false,
}: AttendanceStatusSelectorProps) => {
  const selectedOption = statusOptions.find((opt) => opt.value === value)

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 px-3 py-2 border rounded-md bg-background min-w-[180px]'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='text-sm'>Updating...</span>
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className='w-full min-w-[180px] flex items-center gap-2'>
        <SelectValue placeholder='Select status' />
        {selectedOption && <AttendanceStatusBadge status={value} />}
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className='flex items-center gap-2'>
              <AttendanceStatusBadge status={option.value} />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
