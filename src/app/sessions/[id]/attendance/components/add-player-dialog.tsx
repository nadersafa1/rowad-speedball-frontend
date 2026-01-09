'use client'

import PlayerCombobox from '@/components/players/player-combobox'
import { AttendanceStatusBadge } from '@/components/training-sessions/attendance-status-badge'
import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'

interface AddPlayerDialogProps {
  onAdd: (playerId: string, status: AttendanceStatus) => Promise<void>
  excludedPlayerIds: string[]
  organizationId?: string | null
  onSuccess?: () => void
  onCancel?: () => void
}

const statusOptions: Array<{ value: AttendanceStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'present', label: 'Present' },
  { value: 'late', label: 'Late' },
  { value: 'absent_excused', label: 'Absent (Excused)' },
  { value: 'absent_unexcused', label: 'Absent (Unexcused)' },
  { value: 'suspended', label: 'Suspended' },
]

export const AddPlayerDialog = ({
  onAdd,
  excludedPlayerIds,
  organizationId,
  onSuccess,
  onCancel,
}: AddPlayerDialogProps) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] =
    useState<AttendanceStatus>('pending')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    if (!selectedPlayerId) return

    setIsAdding(true)
    try {
      await onAdd(selectedPlayerId, selectedStatus)
      setSelectedPlayerId('')
      setSelectedStatus('pending')
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsAdding(false)
      onSuccess?.()
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Player to Training Session</DialogTitle>
        <DialogDescription>
          Select a player to add to this training session attendance list.
        </DialogDescription>
      </DialogHeader>
      <div className='space-y-4 py-4'>
        <div className='space-y-2'>
          <Label htmlFor='player'>Player</Label>
          <PlayerCombobox
            value={selectedPlayerId}
            onValueChange={setSelectedPlayerId}
            disabled={isAdding}
            placeholder='Select a player...'
            excludedPlayerIds={excludedPlayerIds}
            organizationId={organizationId}
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='status'>Initial Status</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) =>
              setSelectedStatus(value as AttendanceStatus)
            }
            disabled={isAdding}
          >
            <SelectTrigger>
              <SelectValue placeholder='Select status' />
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
        </div>
      </div>
      <DialogFooter className='flex gap-2 flex-col-reverse md:flex-row'>
        <Button variant='outline' disabled={isAdding} onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleAdd} disabled={!selectedPlayerId || isAdding}>
          {isAdding ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Adding...
            </>
          ) : (
            <>
              <Plus className='mr-2 h-4 w-4' />
              Add Player
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
