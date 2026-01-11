'use client'

import PlayerForm from '@/components/players/player-form'
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { SinglePageHeader } from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePlayerNotesPermissions } from '@/hooks/authorization/use-player-notes-permissions'
import { usePlayerPermissions } from '@/hooks/authorization/use-player-permissions'
import { apiClient } from '@/lib/api-client'
import { usePlayersStore } from '@/store/players-store'
import { Edit, Trash2, Building2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'
import { useFederationPlayerRequestsStore } from '@/store/federation-player-requests-store'
import { JoinFederationDialogContent } from '@/components/players/join-federation-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  const { context } = useOrganizationContext()
  const [editPlayerFormOpen, setEditPlayerFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [joinFederationDialogOpen, setJoinFederationDialogOpen] =
    useState(false)
  const [userImage, setUserImage] = useState<string | null>(null)
  const { requests, fetchRequests } = useFederationPlayerRequestsStore()
  const [playerRequests, setPlayerRequests] = useState<any[]>([])

  const canApplyForFederation =
    (context.isOwner || context.isAdmin) &&
    selectedPlayer?.organizationId === context.organization?.id

  // Note: We allow multiple requests to different federations
  // The API prevents duplicate pending requests for the same player-federation pair

  // Fetch player requests when player is loaded
  useEffect(() => {
    if (selectedPlayer?.id) {
      fetchRequests({
        playerId: selectedPlayer.id,
        limit: 100,
      })
    }
  }, [selectedPlayer?.id, fetchRequests])

  // Filter requests for this player
  useEffect(() => {
    if (selectedPlayer?.id) {
      const filtered = requests.filter((r) => r.playerId === selectedPlayer.id)
      setPlayerRequests(filtered)
    }
  }, [requests, selectedPlayer?.id])

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
      <SinglePageHeader
        backTo='/players'
        actionDialogs={[
          ...(canUpdate
            ? [
                {
                  open: editPlayerFormOpen,
                  onOpenChange: setEditPlayerFormOpen,
                  trigger: (
                    <Button size='sm' className='gap-2' variant='outline'>
                      <Edit className='h-4 w-4' />
                      <span className='hidden sm:inline'>Edit Player</span>
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
                },
              ]
            : []),
          ...(canApplyForFederation
            ? [
                {
                  open: joinFederationDialogOpen,
                  onOpenChange: setJoinFederationDialogOpen,
                  trigger: (
                    <Button size='sm' className='gap-2' variant='outline'>
                      <Building2 className='h-4 w-4' />
                      <span className='hidden sm:inline'>
                        Apply for Federation
                      </span>
                    </Button>
                  ),
                  content: (
                    <JoinFederationDialogContent
                      playerId={selectedPlayer.id}
                      playerName={selectedPlayer.name}
                      open={joinFederationDialogOpen}
                      onOpenChange={setJoinFederationDialogOpen}
                      onSuccess={() => {
                        fetchPlayer(playerId)
                        if (selectedPlayer?.id) {
                          fetchRequests({
                            playerId: selectedPlayer.id,
                            limit: 100,
                          })
                        }
                      }}
                    />
                  ),
                },
              ]
            : []),
        ]}
        alertDialogs={
          canDelete
            ? [
                {
                  open: deleteDialogOpen,
                  onOpenChange: setDeleteDialogOpen,
                  trigger: (
                    <Button size='sm' className='gap-2' variant='destructive'>
                      <Trash2 className='h-4 w-4' />
                      <span className='hidden sm:inline'>Delete Player</span>
                    </Button>
                  ),
                  content: (
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Player</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedPlayer.name}?
                          This action cannot be undone.
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
                  ),
                },
              ]
            : undefined
        }
      />

      {/* Federation Request Status */}
      {canApplyForFederation && playerRequests.length > 0 && (
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='text-lg'>Federation Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {playerRequests.map((request) => (
                <div
                  key={request.id}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex-1'>
                    <p className='font-medium'>{request.federationName}</p>
                    <p className='text-sm text-muted-foreground'>
                      Requested:{' '}
                      {request.requestedAt
                        ? new Date(request.requestedAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    {request.rejectionReason && (
                      <p className='text-sm text-destructive mt-1'>
                        Reason: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      request.status === 'approved'
                        ? 'default'
                        : request.status === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
