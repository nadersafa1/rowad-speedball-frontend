'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageBreadcrumb } from '@/components/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
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
import { usePlayersStore } from '@/store/players-store'
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'
import { usePlayerNotesPermissions } from '@/hooks/authorization/use-player-notes-permissions'
import { toast } from 'sonner'
import PlayerForm from '@/components/players/player-form'
import { apiClient } from '@/lib/api-client'
import { Skeleton } from '@/components/ui/skeleton'
import PlayerOverviewTab from './components/player-overview-tab'
import PlayerNotesTab from './components/player-notes-tab'

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
      {/* Breadcrumb Navigation with Edit/Delete Actions */}
      <div className='mb-6 flex items-center justify-between gap-2'>
        <PageBreadcrumb currentPageLabel={selectedPlayer?.name} />
        {(canUpdate || canDelete) && (
          <div className='flex gap-2'>
            {canUpdate && (
              <Dialog
                open={editPlayerFormOpen}
                onOpenChange={setEditPlayerFormOpen}
              >
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm' className='gap-2'>
                    <Edit className='h-4 w-4' />
                    <span className='hidden sm:inline'>Edit Player</span>
                  </Button>
                </DialogTrigger>
                <PlayerForm
                  player={selectedPlayer}
                  onSuccess={() => {
                    setEditPlayerFormOpen(false)
                    fetchPlayer(playerId)
                  }}
                  onCancel={() => setEditPlayerFormOpen(false)}
                />
              </Dialog>
            )}
            {canDelete && (
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-2 text-destructive hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                    <span className='hidden sm:inline'>Delete Player</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Player</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete{' '}
                      <strong>{selectedPlayer.name}</strong>? This action cannot
                      be undone and will permanently delete all associated test
                      results.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

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
