'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usePlayerNotePermissions } from '@/hooks/authorization/use-player-note-permissions'
import PlayerNoteForm from './player-note-form'
import PlayerNotesList from './player-notes-list'

interface PlayerNotesTabProps {
  playerId: string
  playerOrganizationId?: string | null
}

const PlayerNotesTab = ({
  playerId,
  playerOrganizationId,
}: PlayerNotesTabProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { canCreate } = usePlayerNotePermissions(null, playerOrganizationId)

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
          <CardTitle>Player Notes</CardTitle>
          {canCreate && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className='bg-rowad-600 hover:bg-rowad-700'
              >
                <Plus className='mr-2 h-4 w-4' />
                Add Note
              </Button>
              <PlayerNoteForm
                playerId={playerId}
                onSuccess={() => setIsAddDialogOpen(false)}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <PlayerNotesList playerId={playerId} />
        </CardContent>
      </Card>
    </div>
  )
}

export default PlayerNotesTab
