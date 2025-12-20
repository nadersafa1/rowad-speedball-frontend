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
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { toast } from 'sonner'
import PlayerForm from '@/components/players/player-form'
import { apiClient } from '@/lib/api-client'
import PlayerOverviewTab from './components/player-overview-tab'
import PlayerNotesTab from './components/player-notes-tab'

const PlayerDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string
  const { context } = useOrganizationContext()
  const { isSystemAdmin, isAdmin, isOwner, isCoach } = context
  const { selectedPlayer, fetchPlayer, isLoading, deletePlayer } =
    usePlayersStore()
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
        <div className='animate-pulse space-y-6'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='h-32 bg-gray-200 rounded'></div>
          <div className='h-64 bg-gray-200 rounded'></div>
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
        {(isSystemAdmin ||
          isAdmin ||
          isOwner ||
          isCoach ||
          isSystemAdmin ||
          isAdmin ||
          isOwner) && (
          <div className='flex gap-2'>
            {(isSystemAdmin || isAdmin || isOwner || isCoach) && (
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
            {(isSystemAdmin || isAdmin || isOwner) && (
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PlayerOverviewTab
            selectedPlayer={selectedPlayer}
            playerId={playerId}
            userImage={userImage}
            onResultAdded={() => fetchPlayer(playerId)}
          />
        </TabsContent>

        <TabsContent value="notes">
          <PlayerNotesTab playerId={playerId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PlayerDetailPage
