'use client'

import PlayerForm from '@/components/players/player-form'
import { PageHeader } from '@/components/ui'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlayerNotesPermissions } from '@/hooks/authorization/use-player-notes-permissions'
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'
import { apiClient } from '@/lib/api-client'
import { usePlayersStore } from '@/store/players-store'
import { Edit, Trash2, Volleyball } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import PlayerNotesTab from './components/player-notes-tab'
import PlayerOverviewTab from './components/player-overview-tab'

const PlayerDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string
  const { selectedPlayer, fetchPlayer, isLoading, deletePlayer } =
    usePlayersStore()
  const { canUpdate, canDelete } = usePlayerPermissions(selectedPlayer)
  const { canReadNotes } = usePlayerNotesPermissions(selectedPlayer)
  const [editPlayerFormOpen, setEditPlayerFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userImage, setUserImage] = useState<string | null>(null)

  useEffect(() => {
    if (playerId) {
      fetchPlayer(playerId)
    }
  }, [playerId, fetchPlayer])

  useEffect(() => {
    const fetchUserImage = async () => {
      if (selectedPlayer?.userId) {
        try {
          const user = await apiClient.getUser(selectedPlayer.userId)
          if (user?.image) {
            setUserImage(user.image)
          }
        } catch (error) {
          // Silently fail - user image is optional
          console.error('Failed to fetch user image:', error)
        }
      } else {
        setUserImage(null)
      }
    }

    if (selectedPlayer) {
      fetchUserImage()
    }
  }, [selectedPlayer])

  if (isLoading || !selectedPlayer) {
    return (
      <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
        <div className='space-y-6'>
          <Skeleton className='h-8 w-1/3' />
          <Skeleton className='h-32' />
          <Skeleton className='h-64' />
        </div>
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      await deletePlayer(playerId)
      toast.success('Player deleted successfully')
      router.push('/players')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete player'
      )
    }
  }

  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <PageHeader
        icon={Volleyball}
        title={selectedPlayer?.name}
        description='View and manage player details'
        actionDialogs={[
          {
            trigger: (
              <Button variant='outline' size='sm' className='gap-2'>
                <Edit className='h-4 w-4' />
                Edit Player
              </Button>
            ),
            content: (
              <PlayerForm
                player={selectedPlayer}
                onSuccess={() => {
                  setEditPlayerFormOpen(false)
                  fetchPlayer(playerId)
                }}
                onCancel={() => setEditPlayerFormOpen(false)}
              />
            ),
            open: editPlayerFormOpen,
            onOpenChange: setEditPlayerFormOpen,
          },
          {
            trigger: (
              <Button
                variant='outline'
                size='sm'
                className='gap-2 text-destructive hover:text-destructive'
              >
                <Trash2 className='h-4 w-4' />
                Delete Player
              </Button>
            ),
            content: (
              <PlayerForm
                player={selectedPlayer}
                onSuccess={() => {
                  setDeleteDialogOpen(false)
                  fetchPlayer(playerId)
                }}
                onCancel={() => setDeleteDialogOpen(false)}
              />
            ),
            open: deleteDialogOpen,
            onOpenChange: setDeleteDialogOpen,
          },
        ]}
      />

      {/* Tabs for Overview and Notes */}
      <Tabs defaultValue='overview' className='w-full'>
        {canReadNotes && (
          <TabsList className='grid w-full grid-cols-2 mb-6'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='notes'>Notes</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value='overview'>
          <PlayerOverviewTab
            selectedPlayer={selectedPlayer}
            playerId={playerId}
            userImage={userImage}
            onResultAdded={() => fetchPlayer(playerId)}
          />
        </TabsContent>

        {canReadNotes && (
          <TabsContent value='notes'>
            <PlayerNotesTab
              playerId={playerId}
              playerOrganizationId={selectedPlayer?.organizationId}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default PlayerDetailPage
