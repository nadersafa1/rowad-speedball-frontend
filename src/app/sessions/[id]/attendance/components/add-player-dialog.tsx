'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import PlayerCombobox from '@/components/players/player-combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import type { AttendanceStatus } from '@/hooks/use-training-session-attendance'
import { AttendanceStatusBadge } from '@/components/training-sessions/attendance-status-badge'

interface AddPlayerDialogProps {
  onAdd: (playerId: string, status: AttendanceStatus) => Promise<void>
  excludedPlayerIds: string[]
  organizationId?: string | null
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

export const AddPlayerDialog = ({
  onAdd,
  excludedPlayerIds,
  organizationId,
  isLoading = false,
}: AddPlayerDialogProps) => {
  const [open, setOpen] = useState(false)
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
      setOpen(false)
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' className='gap-2' disabled={isLoading}>
          <Plus className='h-4 w-4' />
          <span className='hidden sm:inline'>Add Player</span>
          <span className='sm:hidden'>Add</span>
        </Button>
      </DialogTrigger>
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
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isAdding}
          >
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
    </Dialog>
  )
}
