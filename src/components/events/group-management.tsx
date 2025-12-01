'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useGroupsStore } from '@/store/groups-store'
import { useRegistrationsStore } from '@/store/registrations-store'
import { Plus, Users, Trash2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { Registration, Group } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface GroupManagementProps {
  eventId: string
  groups: Group[]
  registrations: Registration[]
  onGroupCreated?: () => void
}

const GroupManagement = ({
  eventId,
  groups,
  registrations,
  onGroupCreated,
}: GroupManagementProps) => {
  const { createGroup, deleteGroup, isLoading } = useGroupsStore()
  const { fetchRegistrations } = useRegistrationsStore()
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>(
    []
  )
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)

  const unassignedRegistrations = registrations.filter((r) => !r.groupId)

  const handleCreateGroup = async () => {
    if (selectedRegistrations.length < 2) {
      return
    }

    try {
      await createGroup({
        eventId,
        registrationIds: selectedRegistrations,
      })
      setSelectedRegistrations([])
      await fetchRegistrations(eventId)
      onGroupCreated?.()
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return

    try {
      await deleteGroup(deleteGroupId)
      setDeleteGroupId(null)
      await fetchRegistrations(eventId)
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  const toggleRegistration = (id: string) => {
    setSelectedRegistrations((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    )
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Groups
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {groups.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No groups created yet. Create a group to generate matches.
            </p>
          ) : (
            <div className='space-y-2'>
              {groups.map((group) => {
                const groupRegistrations = registrations.filter(
                  (r) => r.groupId === group.id
                )
                return (
                  <div
                    key={group.id}
                    className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg'
                  >
                    <div className='flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h4 className='font-medium'>Group {group.name}</h4>
                        {group.completed && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className='h-3 w-3 mr-1' />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {groupRegistrations.length} registration
                        {groupRegistrations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => setDeleteGroupId(group.id)}
                      className='w-full sm:w-auto min-w-[44px] min-h-[44px]'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          {unassignedRegistrations.length > 0 && (
            <div className='space-y-2'>
              <h4 className='font-medium'>Unassigned Registrations</h4>
              <div className='space-y-2 max-h-60 overflow-y-auto'>
                {unassignedRegistrations.map((reg) => {
                  // Use new players array if available, fallback to player1/player2
                  const playerNames = reg.players && reg.players.length > 0
                    ? reg.players.map((p) => p.name).join(' & ')
                    : [reg.player1?.name, reg.player2?.name].filter(Boolean).join(' & ') || 'Unknown'
                  
                  return (
                    <div
                      key={reg.id}
                      className={`p-2 border rounded ${
                        selectedRegistrations.includes(reg.id)
                          ? 'bg-primary/10 border-primary'
                          : ''
                      }`}
                    >
                      <div className='flex items-center gap-2'>
                        <Checkbox
                          checked={selectedRegistrations.includes(reg.id)}
                          onCheckedChange={() => toggleRegistration(reg.id)}
                        />
                        <span>{playerNames}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={selectedRegistrations.length < 2 || isLoading}
                className='w-full'
              >
                <Plus className='mr-2 h-4 w-4' />
                Create Group with Selected ({selectedRegistrations.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={deleteGroupId !== null}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This will also delete
              all matches in this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default GroupManagement
